// ========== 吾乡帖 · 饮食偏好与药膳推荐 ==========

// ========== 饮食偏好渲染 ==========
const prefDefs = {
  prefTaste: { label:"日常口味", multi:true, options:["偏辣","偏咸","偏甜","偏酸","清淡","重油"] },
  prefStaple: { label:"主食结构", multi:false, options:["米饭为主","面食为主","混合","杂粮为主"] },
  prefMeat: { label:"肉食习惯", multi:false, options:["偏肉食","偏素食","荤素均衡","无肉不欢"] },
  prefCook: { label:"烹饪偏好", multi:true, options:["喜欢炖煮","喜欢煎炒","喜欢蒸","喜欢凉拌","无所谓"] },
  prefDrink: { label:"饮品习惯", multi:true, options:["常喝茶","常喝咖啡","爱喝冷饮","主要喝温水","常喝汤"] },
  prefSpicy: { label:"吃辣程度", multi:false, options:["无辣不欢","能吃一点","完全不吃"] },
  prefAvoid: { label:"忌口/过敏", multi:true, options:["海鲜过敏","酒精过敏","素食","乳糖不耐受"] },
};

function renderPrefs() {
  for (let [id, def] of Object.entries(prefDefs)) {
    const container = document.getElementById(id);
    if (!container) continue;
    container.innerHTML = def.options.map(o => `
      <label class="pref-btn ${def.multi ? 'multi' : 'single'}">
        <input type="${def.multi ? 'checkbox' : 'radio'}" name="${id}" value="${o}">
        <span>${o}</span>
      </label>
    `).join('');
  }
}
renderPrefs();

function collectPrefs() {
  const result = {};
  for (let id of Object.keys(prefDefs)) {
    const checked = document.querySelectorAll(`#${id} input:checked`);
    result[id] = Array.from(checked).map(c => c.value);
  }
  return result;
}

// ========== 偏好过滤 ==========
function checkDislikes(diet, prefs) {
  const t = diet.ingredients + diet.method + diet.effect;
  const avoid = prefs.prefAvoid || [];
  for (let a of avoid) {
    if (a === "素食" && /[肉鸭羊鸡排骨猪腰鲫鱼]/i.test(t)) return true;
    if (a === "海鲜过敏" && /[鱼虾蟹]/i.test(t)) return true;
    if (a === "酒精过敏" && /酒/.test(t)) return true;
  }
  return false;
}

// ========== 偏好 → 预警 ==========
function getPrefWarnings(prefs, region) {
  const warnings = [];
  const spicy = prefs.prefSpicy || [];
  const taste = prefs.prefTaste || [];

  if (spicy.includes("无辣不欢") && (region.includes("湿") || region.includes("热"))) {
    warnings.push("你爱吃辣，但当前环境湿热偏重——辣会火上浇油，建议暂时减量，多用胡椒、生姜代替辣椒");
  }
  if (spicy.includes("无辣不欢") && region.includes("燥")) {
    warnings.push("你爱吃辣，但当前环境偏燥——辣加重干燥，皮肤和喉咙会更不舒服");
  }
  if (taste.includes("重油") && region.includes("湿")) {
    warnings.push("你喜欢重油口味，但当前环境多湿——油腻加重湿气，身体会更沉重");
  }
  const drink = prefs.prefDrink || [];
  if (drink.includes("爱喝冷饮") && region.includes("湿")) {
    warnings.push("你爱喝冷饮，但湿气重的环境里冷饮伤脾胃、助湿气");
  }

  return warnings;
}

// ========== 冲突驱动打分 ==========
function scoreDiet(diet, analysis, constitution, prefs) {
  let score = 0;
  if (!analysis) return score;

  if (analysis.weatherDeviation && analysis.weatherDeviation.hasDeviation && analysis.weatherDeviation.level === 'high') {
    if (diet.qiEvil) {
      for (let e of analysis.priorityEvils) {
        if (diet.qiEvil.includes(e)) score += 4;
        else if (diet.qiEvil.some(de => EVIL_WUXING[de] === EVIL_WUXING[e])) score += 2;
      }
    }
  }
  if (analysis.migrationConflict && analysis.migrationConflict.level === 'high') {
    if (diet.qiEvil && analysis.priorityEvils) {
      for (let e of analysis.priorityEvils) if (diet.qiEvil.includes(e)) score += 3;
    }
  }
  if (diet.target.includes(constitution.primary)) score += 2;
  const keEvil = qi.keInfo.evil;
  if (diet.qiEvil && diet.qiEvil.includes(keEvil)) score += 2;
  else if (diet.qiEvil) {
    for (let e of diet.qiEvil) { if (EVIL_WUXING[e] === EVIL_WUXING[keEvil]) score += 1; }
  }
  return score;
}

// ========== 推荐 ==========
document.getElementById("submitBtn").addEventListener("click", function() {
  const con = determineConstitution();
  const cCity = currentCitySelect.value, hCity = hometownCitySelect.value;
  const cInfo = cityData[cCity], hInfo = cityData[hCity];
  const prefs = collectPrefs();

  if (!cCity || !cInfo) { alert("请选择现居城市"); return; }
  if (!hCity || !hInfo) { alert("请选择家乡城市（如果就在本地，选同一个即可）"); return; }
  if (con.lowQuality) {
    alert("你打的分数普遍偏低，信息不足以判断体质。请认真重新测评。");
    window.scrollTo(0, 0);
    return;
  }

  const hRegion = hInfo.region, cRegion = cInfo.region;
  const crossCulture = getCrossCultureFoods(hRegion, cRegion);

  // 冲突分析
  const fullAnalysis = getConflictAnalysis(hRegion, cRegion, con.primary, currentWeather, wylq);
  currentConflictAnalysis = {
    migrationConflict: fullAnalysis.conflicts.find(c => c.type === 'migration'),
    constConflict: fullAnalysis.conflicts.find(c => c.type === 'constitution_env'),
    weatherDeviation: fullAnalysis.conflicts.find(c => c.type === 'weather_deviation'),
    hasConflict: fullAnalysis.hasConflict,
    priorityEvils: fullAnalysis.priorityEvils,
    foodClash: fullAnalysis.foodClash,
    homeFood: fullAnalysis.homeFood,
    currFood: fullAnalysis.currFood,
  };

  const prefWarnings = getPrefWarnings(prefs, cRegion);

  // 匹配
  let candidates = diets.filter(d =>
    d.season.includes(currentSeason) &&
    d.region.includes(cRegion) &&
    d.target.includes(con.primary) &&
    !d.avoid.includes(con.primary) &&
    !checkDislikes(d, prefs)
  );
  if (candidates.length < 5) {
    candidates = diets.filter(d =>
      d.season.includes(currentSeason) &&
      d.region.includes(cRegion) &&
      !d.avoid.includes(con.primary) &&
      !checkDislikes(d, prefs)
    );
  }
  if (candidates.length < 5) {
    candidates = diets.filter(d =>
      d.season.includes(currentSeason) &&
      !d.avoid.includes(con.primary) &&
      !checkDislikes(d, prefs)
    );
  }

  // 打分排序
  candidates.forEach(d => { d._score = scoreDiet(d, currentConflictAnalysis, con, prefs); });
  candidates.sort((a, b) => b._score - a._score);

  // 家乡胃加分：跨文化推荐的食物名匹配到食谱
  if (crossCulture) {
    const ccFoods = crossCulture.foods.map(f => f.replace(/[（(].+[）)]/g,'').trim());
    candidates.forEach(d => {
      const nameNoSuffix = d.name.replace(/[（(].+[）)]/g,'').trim();
      if (ccFoods.some(f => nameNoSuffix.includes(f) || f.includes(nameNoSuffix))) d._score += 3;
      if (d.origin && hRegion && d.origin.includes(hRegion.split(/[东西南北中]/)[0])) d._score += 2;
    });
  }

  // 本地菜优先：origin 匹配当前城市省份或气候区
  const lp = cInfo.province || '';
  const lr = cInfo.region || '';
  function isLocalDish(d) {
    if (!d.origin) return false;
    const o = d.origin;
    if (lp && (o.includes(lp) || lp.includes(o))) return true;
    // region关键词匹配：如 "华东湿热" 匹配 origin "华东"
    const regionParts = lr.split(/[东西南北中]/).filter(Boolean);
    for (let rp of regionParts) {
      if (rp.length >= 2 && o.includes(rp)) return true;
    }
    if (o === lr) return true;
    return false;
  }
  const localDishes = candidates.filter(isLocalDish);
  const nonLocal = candidates.filter(d => !isLocalDish(d));
  // 把本地菜按分数插入前10
  const merged = [];
  for (let d of localDishes) { if (merged.length < 10) merged.push(d); }
  for (let d of nonLocal) { if (merged.length < 10) merged.push(d); }
  // merged 前几个是分数最高的 local，然后填充 nonLocal（都已按分数排好）
  // 取前10进候选池，随机抽3，但保证至少1道本地菜
  const pool = merged.slice(0, Math.min(10, merged.length));
  shuffleArray(pool);
  let results = pool.slice(0, Math.min(6, pool.length));
  // 保证至少2道本地菜
  if (localDishes.length >= 2 && results.filter(isLocalDish).length < 2) {
    for (let li = 0; li < localDishes.length && results.filter(isLocalDish).length < 2; li++) {
      if (!results.some(r => r.id === localDishes[li].id)) {
        const replaceIdx = results.length - 1; // 替换最后一道
        results[replaceIdx] = localDishes[li];
      }
    }
  } else if (localDishes.length === 1 && !results.some(isLocalDish)) {
    results[results.length - 1] = localDishes[0];
  }

  // 视图
  document.getElementById("mainSection").style.display = "none";
  document.getElementById("resultSection").style.display = "block";
  window.scrollTo(0, 0);

  // ===== 天气预警（14天剧变检测 + 自动匹配药膳） =====
  let weatherAlerts = [], weatherAlertDiets = [];
  if (currentWeather && currentWeather.daily) {
    weatherAlerts = detectClimateAlerts(currentWeather.daily);
    if (weatherAlerts.length > 0) {
      // 为每个预警匹配药膳
      const alertEvils = [...new Set(weatherAlerts.map(a => a.evil))];
      weatherAlertDiets = diets.filter(d => {
        if (!d.qiEvil || d.qiEvil.length === 0) return false;
        return alertEvils.some(e => d.qiEvil.includes(e)) && d.season.includes(currentSeason);
      });
      // 按覆盖的邪气种类数排序
      weatherAlertDiets.forEach(d => {
        d._alertScore = d.qiEvil.filter(e => alertEvils.includes(e)).length;
      });
      weatherAlertDiets.sort((a, b) => b._alertScore - a._alertScore);
      weatherAlertDiets = weatherAlertDiets.slice(0, 6);
    }
  }

  // ===== 游子身份条 =====
  const hf = REGION_FOOD_CULTURE[hRegion];
  const cf = REGION_FOOD_CULTURE[cRegion];
  const isSameCity = hCity === cCity;
  const isSameRegion = hRegion === cRegion;
  let bannerHTML = '';
  if (isSameCity) {
    bannerHTML = `<div class="migrant-banner same"><div class="mb-route">🏠📍 <strong>${hCity}</strong></div><div class="mb-note">此心安处是吾乡</div></div>`;
  } else {
    const diffNote = isSameRegion
      ? `同属${hRegion.split(/[东西南北中]/)[0]}，气候相近`
      : `${hf ? hf.taste : ''}的胃 → ${cf ? cf.taste : ''}的水土`;
    bannerHTML = `<div class="migrant-banner"><div class="mb-route">🏠 <strong>${hCity}</strong> &nbsp;→&nbsp; 📍 <strong>${cCity}</strong></div><div class="mb-note">${diffNote}</div></div>`;
  }
  document.getElementById("migrantBanner").innerHTML = bannerHTML;

  // 体质画像
  if (con.isBalanced) {
    document.getElementById("constitutionResult").innerHTML = `
      <div class="const-result balanced">
        <div class="cr-primary">😊 平和质</div>
        <div class="cr-desc">${CONST_PLAIN['平和质']}</div>
        <div class="cr-bars">${renderScoreBars(con.scores)}</div>
      </div>`;
  } else {
    const top3 = Object.entries(con.scores)
      .filter(([k]) => k !== "平和质")
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    document.getElementById("constitutionResult").innerHTML = `
      <div class="const-result">
        <div class="cr-primary">${con.primary}</div>
        ${con.secondary ? `<div class="cr-secondary">兼夹：${con.secondary}</div>` : ''}
        <div class="cr-desc">${CONST_PLAIN[con.primary] || ''}</div>
        <div class="cr-bars">${renderScoreBars(con.scores)}</div>
      </div>`;
  }

  // 冲突指导
  const a = currentConflictAnalysis;
  const g = getPlainGuidance(wylq, currentWeather, cInfo);
  let guideHtml = '';

  // 天气预警（优先显示）
  if (weatherAlerts.length > 0) {
    const alertIcons = { '寒潮降温':'❄️', '热浪升温':'🔥', '持续高温':'☀️', '持续阴雨':'🌧', '温差异常':'🌬' };
    const alertHTML = weatherAlerts.map(a => {
      const icon = alertIcons[a.type] || '⚠️';
      const typeClass = a.type === '寒潮降温' ? 'alert-cold' : a.type === '热浪升温' || a.type === '持续高温' ? 'alert-hot' : a.type === '持续阴雨' ? 'alert-rain' : 'alert-wind';
      return `<div class="alert-item ${typeClass}"><span class="alert-item-icon">${icon}</span><span>${a.msg}</span></div>`;
    }).join('');
    guideHtml += `<div class="reason-item warning"><span class="reason-icon">⚠️</span><div><strong>🌡 未来天气剧变预警</strong><div class="alert-list">${alertHTML}</div></div></div>`;
  }

  if (a.weatherDeviation && a.weatherDeviation.hasDeviation && a.weatherDeviation.level === 'high') {
    guideHtml += `<div class="reason-item warning"><span class="reason-icon">⚠️</span><div><strong>天气反常</strong><p>${a.weatherDeviation.message}</p></div></div>`;
  }
  if (a.migrationConflict && a.migrationConflict.level !== 'low') {
    guideHtml += `<div class="reason-item"><span class="reason-icon">🚨</span><div><strong>水土不服</strong><p>${a.migrationConflict.body?.slice(0, 80)}...</p></div></div>`;
  }
  if (a.constConflict) {
    guideHtml += `<div class="reason-item"><span class="reason-icon">🧬</span><div><strong>体质×环境</strong><p>${a.constConflict.note}</p></div></div>`;
  }
  if (prefWarnings.length > 0) {
    prefWarnings.forEach(w => {
      guideHtml += `<div class="reason-item warning"><span class="reason-icon">💡</span><div><strong>饮食偏好预警</strong><p>${w}</p></div></div>`;
    });
  }
  if (a.priorityEvils && a.priorityEvils.length > 0) {
    guideHtml += `<div class="reason-item"><span class="reason-icon">🎯</span><div><strong>调理优先级</strong><p>${a.priorityEvils.map(e => `${e}邪`).join(' → ')}</p></div></div>`;
  }
  if (!guideHtml) guideHtml = '<p>✅ 没有明显冲突，按季节和体质常规推荐即可</p>';
  document.getElementById("guideBody").innerHTML = guideHtml;

  // 当下时令 + 天气
  const e = emojiMap[qi.keInfo.evil] || '🌿';
  let weatherCardHtml = '', chartData = null;
  if (currentWeather) {
    const w = currentWeather;
    const wCode = w.weatherCode;
    const wDesc = wCode === 0 ? "☀️ 晴" : wCode <= 3 ? "⛅ 多云" : wCode <= 48 ? "🌫 雾/霾" : wCode <= 67 ? "🌧 雨" : wCode <= 77 ? "❄️ 雪" : wCode <= 82 ? "🌧 阵雨" : "⛈ 雷雨";
    const feelsLike = w.feelsLike;
    const diag = diagnoseWeather(w);
    const evilSummary = diag ? diag.evils.filter(e=>e.name!=='平和').map(e=>e.name).join('·') : '';
    weatherCardHtml = `<div class="weather-now">
      <div class="wn-main"><span class="wn-icon">${wDesc.split(' ')[0]}</span><span class="wn-temp">${w.temp}°C</span></div>
      <div class="wn-detail">体感 ${feelsLike}°C · 湿度 ${w.humidity}% · 风速 ${w.windSpeed}km/h</div>
      ${evilSummary ? `<div class="wn-evil">⚡ ${evilSummary} 活跃</div>` : ''}
    </div>`;

    // 七日温度折线数据
    if (w.daily && w.daily.time && w.daily.time.length >= 2) {
      const n = Math.min(7, w.daily.time.length);
      const days = [], highs = [], lows = [];
      for (let i = 0; i < n; i++) {
        if (w.daily.temperature_2m_max[i] == null || w.daily.temperature_2m_min[i] == null) continue;
        days.push(w.daily.time[i].slice(5));
        highs.push(w.daily.temperature_2m_max[i]);
        lows.push(w.daily.temperature_2m_min[i]);
      }
      if (days.length >= 2) chartData = { days, highs, lows, today: w.temp };
    }
  }
  document.getElementById("contextHead").innerHTML = `${e} 当下时令 · ${qi.dateRange}`;
  const chartHTML = chartData
    ? `<div class="temp-chart"><canvas id="tempChart" width="460" height="180"></canvas></div>`
    : (currentWeather ? '<div class="temp-chart"><p style="text-align:center;color:#999;font-size:12px;">温度数据不足</p></div>' : '');
  document.getElementById("contextBody").innerHTML = `
    <div class="context-summary"><strong>${g.headline}</strong></div>
    ${weatherCardHtml}
    <div class="context-grid">
      <div class="cg-item"><span class="cg-label">身体容易</span><span class="cg-val">${g.bodySignals.slice(0,3).join('、')}</span></div>
      <div class="cg-item"><span class="cg-label">饮食方向</span><span class="cg-val eat">多吃 ${g.eatList.slice(0,4).join('、')}</span><span class="cg-val avoid">少碰 ${g.avoidList.slice(0,3).join('、')}</span></div>
    </div>
    ${g.climateNote ? `<p class="context-note">📍 ${g.climateNote}</p>` : ''}
    ${g.yearNote ? `<p class="context-note">📅 ${g.yearNote}</p>` : ''}
    ${g.interaction ? `<p class="context-note">💡 ${g.interaction}</p>` : ''}
    <details class="context-detail"><summary>运气原文</summary><div class="tcm-footnote">${wylq.pattern.ganZhi}年 · 岁运：${wylq.pattern.suiYun} · 司天：${wylq.pattern.siTian} · 在泉：${wylq.pattern.zaiQuan}<br>${qi.name} · 主气：${qi.zhuQi} · 客气：${qi.keQi}</div></details>
  `;

  // 绘制七日折线图
  if (chartData) drawTempChart('tempChart', chartData);

  // ===== 药膳推荐（标签切换模式）=====
  const cardsDiv = document.getElementById("dietCards");
  cardsDiv.innerHTML = "";
  document.getElementById("refreshHint").style.display = "block";

  // 收集三个标签的内容
  const tabs = []; // { id, label, icon, html, active }
  let usedDietIds = new Set();

  // ——— 标签1：天气预警 ———
  let weatherTabHTML = '';
  if (weatherAlertDiets.length > 0 && weatherAlerts.length > 0) {
    const resultIds = new Set(results.map(d => d.id));
    const alertUnique = weatherAlertDiets.filter(d => !resultIds.has(d.id)).slice(0, 3);
    const alertCards = alertUnique.length > 0 ? alertUnique : weatherAlertDiets.slice(0, 2);
    if (alertCards.length > 0) {
      const alertTypes = [...new Set(weatherAlerts.map(a => a.type))];
      const typeLabels = { '寒潮降温':'降温','热浪升温':'升温','持续高温':'高温','持续阴雨':'阴雨','温差异常':'温差' };
      const desc = alertTypes.map(t => typeLabels[t] || t).join('·');
      const alertDesc = `<div class="tab-desc"><strong>🌡 ${cCity} · ${desc}</strong><span> — 天气骤变时提前调理，减少对身体的冲击</span></div>`;
      weatherTabHTML = alertDesc + alertCards.map(d => { usedDietIds.add(d.id); return renderDietCard(d, true).outerHTML; }).join('');
    }
  }

  // ——— 标签2：融入当地 ———
  let localTabHTML = '', localHasFullRecipes = false;
  if (crossCulture && !(hRegion === cRegion)) {
    const clashNote = a.foodClash ? a.foodClash.note : '';
    const homeLabel = crossCulture.homeTaste || '';
    const currLabel = a.currFood ? a.currFood.taste : '';
    const challengeLabel = crossCulture.challenge === '寒' ? '寒冷' : crossCulture.challenge === '燥' ? '干燥' : '湿气';
    const shortPrinciple = crossCulture.principle.split('——')[0].trim();
    const localDesc = `<div class="tab-desc"><strong>🏠 ${hCity} → 📍 ${cCity}</strong><span> — 从${homeLabel}到${currLabel}，${shortPrinciple}</span></div>`;

    const crossDietMatches = [];
    crossCulture.foods.forEach(foodName => {
      const coreName = foodName.replace(/[（(].+[）)]/g, '').trim();
      const match = diets.find(d => {
        const dCore = d.name.replace(/[（(].+[）)]/g, '').trim();
        return dCore.includes(coreName) || coreName.includes(dCore) ||
               foodName.includes(d.name) || d.name.includes(coreName);
      });
      if (match && !crossDietMatches.some(m => m.id === match.id)) crossDietMatches.push(match);
    });

    if (crossDietMatches.length > 0) {
      localHasFullRecipes = true;
      localTabHTML = localDesc + crossDietMatches.slice(0, 3).map(d => { usedDietIds.add(d.id); return renderDietCard(d, false).outerHTML; }).join('');
    } else {
      localTabHTML = localDesc + `<div class="ccc-foods">${crossCulture.foods.slice(0, 4).map(f => `<span class="ccc-food-chip">${f}</span>`).join(' ')}</div>`;
    }
  }

  // ——— 标签3：体质调理 ———
  let bodyTabHTML = '';
  const plainDesc = CONST_PLAIN[con.primary] || '';
  const bodyShort = plainDesc ? plainDesc.split('——')[0] : con.primary;
  const bodySub = plainDesc ? (plainDesc.split('——')[1] || plainDesc.split('——')[0]) : '这些药膳针对你的体质和时令搭配';
  const bodyDesc = `<div class="tab-desc"><strong>🧬 ${con.primary}${con.secondary ? '兼' + con.secondary : ''} · ${currentSeason}·${qi.keInfo.evil}邪当令</strong><span> — ${bodySub}</span></div>`;
  if (results.length > 0) {
    bodyTabHTML = bodyDesc + results.filter(d => !usedDietIds.has(d.id)).map(d => renderDietCard(d, false).outerHTML).join('');
    // 如果去重后不够，补回来
    if (results.filter(d => !usedDietIds.has(d.id)).length === 0) {
      bodyTabHTML = bodyDesc + results.slice(0, 6).map(d => renderDietCard(d, false).outerHTML).join('');
    }
  }

  // 兜底
  if (!bodyTabHTML) {
    const fallback = diets.filter(d => d.season.includes(currentSeason) && !d.avoid.includes(con.primary)).slice(0, 4);
    if (fallback.length > 0) {
      bodyTabHTML = fallback.map(d => renderDietCard(d, false).outerHTML).join('');
    }
  }
  if (!bodyTabHTML) bodyTabHTML = '<p style="text-align:center;color:#999;">😔 暂无匹配的药膳，请调整偏好。</p>';

  // 构建标签列表
  if (weatherTabHTML) tabs.push({ id:'weather', label:'天气预警', icon:'🌡', html:weatherTabHTML });
  if (localTabHTML) tabs.push({ id:'local', label:'融入当地', icon:'🏠', html:localTabHTML });
  tabs.push({ id:'body', label:'体质调理', icon:'🍲', html:bodyTabHTML });

  // 默认选中「体质调理」，如果只有它一个就不需要标签切换
  if (tabs.length <= 1) {
    cardsDiv.innerHTML = `<div class="alert-diet-header" style="background:#fafaf7;color:#5a3e2b;">🍲 推荐药膳</div>` + bodyTabHTML;
  } else {
    // 找到默认激活的标签（体质调理优先）
    const activeId = tabs.find(t => t.id === 'body') ? 'body' : tabs[0].id;
    const btnsHTML = tabs.map(t => `<button class="dst-btn${t.id === activeId ? ' active' : ''}" data-dst="${t.id}">${t.icon} ${t.label}</button>`).join('');
    const panelsHTML = tabs.map(t => `<div class="dsp-panel${t.id === activeId ? ' active' : ''}" id="dst-panel-${t.id}">${t.html}</div>`).join('');

    cardsDiv.innerHTML = `<div class="diet-section-tabs">${btnsHTML}</div><div class="diet-section-panels">${panelsHTML}</div>`;

    // 绑定切换事件
    cardsDiv.querySelectorAll('.dst-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const targetId = this.dataset.dst;
        cardsDiv.querySelectorAll('.dst-btn').forEach(b => b.classList.remove('active'));
        cardsDiv.querySelectorAll('.dsp-panel').forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        const panel = document.getElementById('dst-panel-' + targetId);
        if (panel) panel.classList.add('active');
      });
    });
  }
});

function renderDietCard(d, isAlert) {
  const card = document.createElement("div");
  card.className = "diet-card" + (isAlert ? " diet-alert" : "");
  const score = d._score || 0;
  const badge = score >= 6 ? '<span class="qi-badge hot">强烈推荐</span>' : score >= 3 ? '<span class="qi-badge">推荐</span>' : '';
  card.innerHTML = `
    <h3>🍲 ${d.name} ${badge} ${d.origin ? `<span style="font-size:12px;color:#8b5a2b;background:#faf0e0;padding:2px 6px;border-radius:8px;">📍 ${d.origin}</span>` : ''}</h3>
    ${d.taste ? `<p class="taste-hint">👅 口感：${d.taste}</p>` : ''}
    <p><strong>食材：</strong>${d.ingredients}</p>
    <p><strong>做法：</strong>${d.method}</p>
    <p><strong>功效：</strong>${d.effect}</p>
    <div class="risk">⚠️ <strong>注意：</strong><br>${d.risk}<br>🚫 <strong>不适合：</strong>${d.ban}</div>`;
  return card;
}
