// ========== 季节 ==========
const seasonMonths = { "春":[2,3,4],"夏":[5,6,7],"长夏":[8],"秋":[9,10,11],"冬":[12,1] };
function getCurrentSeason() {
  const m = new Date().getMonth()+1;
  for (let [s, ms] of Object.entries(seasonMonths)) if (ms.includes(m)) return s;
  return "春";
}
const currentSeason = getCurrentSeason();

// ========== 五运六气 ==========
const wylq = getCurrentWYLQ();
const qi = wylq.currentQi;

// ========== Emoji ==========
const emojiMap = { '风':'🌬','热':'🔥','暑':'☀️','湿':'💧','燥':'🍂','寒':'❄️' };

// ========== 体质问卷 ==========
const questions = [
  { key:"平和质", text:"您是否精力充沛、面色红润、睡眠良好？" },
  { key:"气虚质", text:"您是否容易疲劳、气短、说话声音低弱？" },
  { key:"阳虚质", text:"您是否怕冷、手脚发凉、喜欢热饮？" },
  { key:"阴虚质", text:"您是否手心发热、口干咽燥、偏好冷饮？" },
  { key:"痰湿质", text:"您是否感觉身体沉重、腹部肥满、舌苔厚腻？" },
  { key:"湿热质", text:"您是否面部油腻、口苦口臭、大便粘滞？" },
  { key:"血瘀质", text:"您是否肤色晦暗、容易出现瘀斑、身体有刺痛？" },
  { key:"气郁质", text:"您是否情绪低落、容易紧张焦虑、胸闷胁胀？" },
  { key:"特禀质", text:"您是否容易过敏、打喷嚏、有哮喘或皮肤问题？" },
];

const questionsDiv = document.getElementById("questions");
questions.forEach((q, i) => {
  const div = document.createElement("div");
  div.className = "question-item";
  div.innerHTML = `
    <label>${i+1}. ${q.text}</label>
    <div class="slider-container">
      <span>1</span>
      <input type="range" min="1" max="5" value="1" id="q_${q.key}">
      <span id="val_${q.key}">1</span>
    </div>`;
  questionsDiv.appendChild(div);
});
document.querySelectorAll('input[type="range"]').forEach(s => {
  s.addEventListener("input", function() {
    const v = document.getElementById("val_"+this.id.replace("q_",""));
    if (v) v.textContent = this.value;
  });
});

// ========== 双城市选择器 ==========
const cityList = Object.keys(cityData).sort();
function fillCitySelect(selId) {
  const sel = document.getElementById(selId);
  cityList.forEach(c => {
    const o = document.createElement("option");
    o.value = c; o.textContent = c;
    sel.appendChild(o);
  });
}
fillCitySelect("hometownSelect");
fillCitySelect("citySelect");

const hometownSelect = document.getElementById("hometownSelect");
const citySelect = document.getElementById("citySelect");

// ========== 天气缓存 ==========
const weatherCache = {};
async function fetchWeather(lat, lon) {
  const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
  if (weatherCache[key] && (Date.now() - weatherCache[key].ts) < 30*60*1000) return weatherCache[key].data;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FShanghai&forecast_days=5`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error("API error");
    const j = await r.json();
    const d = {
      temp: j.current.temperature_2m,
      feelsLike: j.current.apparent_temperature,
      humidity: j.current.relative_humidity_2m,
      windSpeed: j.current.wind_speed_10m,
      weatherCode: j.current.weather_code,
      daily: j.daily,
    };
    weatherCache[key] = { data: d, ts: Date.now() };
    return d;
  } catch(e) { console.warn("天气API:", e.message); return null; }
}

const WMO_CODES = {
  0:"☀️",1:"🌤",2:"⛅",3:"☁️",45:"🌫",48:"🌫",
  51:"🌧",53:"🌧",55:"🌧",61:"🌧",63:"🌧",65:"🌧",
  71:"🌨",73:"🌨",75:"🌨",80:"🌦",81:"🌦",82:"⛈",
  85:"🌨",86:"🌨",95:"⛈",96:"⛈",99:"⛈",
};

// ========== 渲染冲突卡片 ==========
function renderConflictCard(analysis, weather) {
  const card = document.getElementById("conflictCard");
  const placeholder = document.getElementById("placeholderCard");
  if (!analysis) {
    card.style.display = "none";
    placeholder.style.display = "block";
    return;
  }

  card.style.display = "block";
  placeholder.style.display = "none";

  const hero = document.getElementById("conflictHero");
  const list = document.getElementById("conflictList");
  const foot = document.getElementById("conflictFoot");
  const why = document.getElementById("whyContent");

  const keEmoji = emojiMap[qi.keInfo.evil] || '🌿';

  // 英雄区：一句话总结
  if (analysis.hasConflict) {
    const top = analysis.conflicts[0];
    hero.innerHTML = `
      <div class="hero-emoji">${top.type === 'migration' ? '🚨' : top.type === 'weather_deviation' ? '⚠️' : '🔍'}</div>
      <div class="hero-text">
        <div class="hero-title">${top.title || top.note?.split('——')[0] || '环境与身体不太匹配'}</div>
        <div class="hero-sub">${top.body || top.note || top.message || ''}</div>
      </div>`;
  } else {
    const g = getPlainGuidance(wylq, weather, cityData[citySelect.value]);
    hero.innerHTML = `
      <div class="hero-emoji">${keEmoji}</div>
      <div class="hero-text">
        <div class="hero-title">${g.headline}</div>
        <div class="hero-sub">${qi.dateRange} · 当前环境与你的身体基本匹配，按常规调养即可</div>
      </div>`;
  }

  // 冲突列表
  let listHtml = '';
  if (analysis.migrationConflict && analysis.migrationConflict.level !== 'low') {
    listHtml += renderConflictItem('🚨', '水土不服', analysis.migrationConflict.body, analysis.migrationConflict.tips);
  }
  if (analysis.constConflict) {
    listHtml += renderConflictItem('🧬', '体质×环境', analysis.constConflict.note, [analysis.constConflict.foods ? `推荐食材：${analysis.constConflict.foods.join('、')}` : '']);
  }
  if (analysis.weatherDeviation && analysis.weatherDeviation.hasDeviation) {
    listHtml += renderConflictItem('⚠️', '天气反常预警', analysis.weatherDeviation.message, []);
  }
  if (analysis.foodClash) {
    listHtml += renderConflictItem('🍽', '饮食习惯冲突', analysis.foodClash.note, []);
  }
  if (!listHtml) {
    listHtml = '<p class="no-conflict">✅ 没有发现明显的冲突点，身体状况和环境比较和谐</p>';
  }
  list.innerHTML = listHtml;

  // 饮食优先级
  if (analysis.priorityEvils && analysis.priorityEvils.length > 0) {
    foot.innerHTML = `
      <div class="priority-bar">
        <span>🎯 当前调理优先级：</span>
        ${analysis.priorityEvils.map(e => `<span class="priority-tag">${e}</span>`).join(' > ')}
      </div>`;
  } else {
    foot.innerHTML = '';
  }

  // 原理折叠区
  const p = wylq.pattern;
  const g = getPlainGuidance(wylq, weather, cityData[citySelect.value]);
  why.innerHTML = `
    <p><strong>${g.why}</strong></p>
    ${g.interaction ? `<p>💡 ${g.interaction}</p>` : ''}
    ${g.yearNote ? `<p>📅 ${g.yearNote}</p>` : ''}
    ${g.climateNote ? `<p>📍 ${g.climateNote}</p>` : ''}
    <div class="tcm-footnote">
      <span>${p.ganZhi}年</span> · <span>岁运：${p.suiYun}</span> · <span>司天：${p.siTian}</span> · <span>在泉：${p.zaiQuan}</span><br>
      <span>${qi.name} · 主气：${qi.zhuQi} · 客气：${qi.keQi}</span><br>
      <span>${qi.dateRange}</span>
    </div>`;
}

function renderConflictItem(emoji, label, body, tips) {
  return `
    <div class="conflict-item">
      <div class="ci-head"><span class="ci-emoji">${emoji}</span><strong>${label}</strong></div>
      <p class="ci-body">${body}</p>
      ${tips.length > 0 ? `<div class="ci-tips">${tips.map(t => `<span class="ci-tip">${t}</span>`).join('')}</div>` : ''}
    </div>`;
}

// ========== 城市选择联动 ==========
let currentWeather = null;
let currentConflictAnalysis = null;

async function onCityChange() {
  const hCity = hometownSelect.value;
  const cCity = citySelect.value;
  const hInfo = cityData[hCity];
  const cInfo = cityData[cCity];

  // 饮食文化提示
  if (hInfo) {
    const hf = REGION_FOOD_CULTURE[hInfo.region];
    document.getElementById("hometownFood").textContent =
      hf ? `${hf.taste} · ${hf.habit}` : getClimatePlain(hInfo.region);
  } else {
    document.getElementById("hometownFood").textContent = '';
  }
  if (cInfo) {
    const cf = REGION_FOOD_CULTURE[cInfo.region];
    document.getElementById("currentFood").textContent =
      cf ? `${cf.taste} · ${cf.habit}` : getClimatePlain(cInfo.region);
  } else {
    document.getElementById("currentFood").textContent = '';
  }

  // 需要现居地才能继续
  if (!cInfo) {
    currentWeather = null;
    currentConflictAnalysis = null;
    document.getElementById("migrationNote").textContent = '';
    renderConflictCard(null, null);
    return;
  }

  // 获取天气
  currentWeather = await fetchWeather(cInfo.lat, cInfo.lon);

  // 渲染冲突卡片（先不带体质）
  const hRegion = hInfo ? hInfo.region : null;
  const cRegion = cInfo.region;
  const fullAnalysis = getConflictAnalysis(hRegion, cRegion, null, currentWeather, wylq);

  // 解构
  currentConflictAnalysis = {
    migrationConflict: fullAnalysis.conflicts.find(c => c.type === 'migration'),
    constConflict: null, // 还没填体质
    weatherDeviation: fullAnalysis.conflicts.find(c => c.type === 'weather_deviation'),
    hasConflict: fullAnalysis.hasConflict,
    priorityEvils: fullAnalysis.priorityEvils,
    foodClash: fullAnalysis.foodClash,
    homeFood: fullAnalysis.homeFood,
    currFood: fullAnalysis.currFood,
  };

  renderConflictCard(currentConflictAnalysis, currentWeather);

  // 迁移提示
  if (hRegion && cRegion && hRegion !== cRegion) {
    const hName = getClimatePlain(hRegion).split('，')[0] || hRegion;
    const cName = getClimatePlain(cRegion).split('，')[0] || cRegion;
    document.getElementById("migrationNote").innerHTML =
      `<span class="migration-badge">🔄 水土不服风险</span> 你的身体底子是"${hName}"，现在面对"${cName}"环境——饮食上需要特别注意`;
  } else if (hRegion && hRegion === cRegion) {
    document.getElementById("migrationNote").innerHTML =
      '<span class="migration-ok">✅ 家乡和现居地气候相近，水土适应的压力不大</span>';
  } else {
    document.getElementById("migrationNote").textContent = '';
  }
}

hometownSelect.addEventListener("change", onCityChange);
citySelect.addEventListener("change", onCityChange);

// ========== 体质大白话 ==========
const CONST_PLAIN = {
  '平和质': '体质比较均衡，继续保持良好的生活习惯就行',
  '气虚质': '容易累、气不够用，像手机电量总在20%以下——需要"充电"',
  '阳虚质': '怕冷、火力不足，像冬天暖气不够热——需要"加温"',
  '阴虚质': '身体水分和津液不足，像锅里的水快烧干了——需要"加水"',
  '痰湿质': '身体代谢慢、湿气重，像排水管堵了——需要"疏通"',
  '湿热质': '又湿又热，像闷热的桑拿天——需要"清热除湿"',
  '血瘀质': '血液循环不畅，像水管有沉积物——需要"活血"',
  '气郁质': '气机不顺畅，容易闷闷不乐——需要"疏解"',
  '特禀质': '天生比较敏感，容易过敏——需要"保护"',
};

// ========== 体质判定 ==========
function determineConstitution() {
  const scores = {};
  questions.forEach(q => { scores[q.key] = parseInt(document.getElementById("q_"+q.key).value); });
  let primary = "平和质", max = 0;
  for (let [k,v] of Object.entries(scores)) { if (v > max) { max = v; primary = k; } }
  if (max <= 2) primary = "平和质";
  let secondary = null, s2 = 0;
  for (let [k,v] of Object.entries(scores)) { if (k !== primary && v >= 3 && v > s2) { s2 = v; secondary = k; } }
  return { primary, secondary };
}

// ========== 偏好过滤 ==========
function checkDislikes(diet, dislikes) {
  const t = diet.ingredients + diet.method;
  for (let d of dislikes) {
    if (d === "素食" && /[肉鸭羊鸡排骨]/i.test(t)) return true;
    if (d === "忌海鲜" && /[鱼虾蟹]/i.test(t)) return true;
    if (d === "忌辛辣" && /[辣椒花椒蒜姜]/i.test(t)) return true;
    if (d === "忌羊肉" && /羊/.test(t)) return true;
    if (d === "忌酒" && /酒/.test(t)) return true;
  }
  return false;
}

// ========== 冲突驱动的推荐打分 ==========
function scoreDietForConflicts(diet, analysis, constitution) {
  let score = 0;

  // 天气偏差优先：如果天气反常，qiEvil匹配权重最高
  if (analysis.weatherDeviation && analysis.weatherDeviation.hasDeviation &&
      analysis.weatherDeviation.level === 'high') {
    if (diet.qiEvil) {
      for (let e of analysis.priorityEvils) {
        if (diet.qiEvil.includes(e)) score += 4;
        else if (diet.qiEvil.some(de => EVIL_WUXING[de] === EVIL_WUXING[e])) score += 2;
      }
    }
  }

  // 水土不服优先
  if (analysis.migrationConflict && analysis.migrationConflict.level === 'high') {
    if (diet.qiEvil && analysis.priorityEvils) {
      for (let e of analysis.priorityEvils) {
        if (diet.qiEvil.includes(e)) score += 3;
      }
    }
  }

  // 体质匹配
  if (diet.target.includes(constitution.primary)) score += 2;

  // 运气匹配（基本分）
  const keEvil = qi.keInfo.evil;
  if (diet.qiEvil && diet.qiEvil.includes(keEvil)) score += 2;
  else if (diet.qiEvil) {
    for (let e of diet.qiEvil) {
      if (EVIL_WUXING[e] === EVIL_WUXING[keEvil]) score += 1;
    }
  }

  return score;
}

// ========== 推荐 ==========
document.getElementById("submitBtn").addEventListener("click", function() {
  const con = determineConstitution();
  const cCity = citySelect.value;
  const hCity = hometownSelect.value;
  const cInfo = cityData[cCity];
  const hInfo = cityData[hCity];

  if (!cCity || !cInfo) { alert("请选择现居城市"); return; }
  if (!hCity || !hInfo) { alert("请选择家乡城市（如果就在本地，选同一个城市即可）"); return; }

  const hRegion = hInfo.region;
  const cRegion = cInfo.region;
  const checkboxes = document.querySelectorAll('#preferences input[type="checkbox"]:checked');
  const dislikes = Array.from(checkboxes).map(cb => cb.value);

  // 更新冲突分析（带上体质）
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

  // 匹配
  let candidates = diets.filter(d =>
    d.season.includes(currentSeason) &&
    d.region.includes(cRegion) &&
    d.target.includes(con.primary) &&
    !d.avoid.includes(con.primary) &&
    !checkDislikes(d, dislikes)
  );
  if (candidates.length === 0) {
    candidates = diets.filter(d =>
      d.season.includes(currentSeason) &&
      d.region.includes(cRegion) &&
      !d.avoid.includes(con.primary) &&
      !checkDislikes(d, dislikes)
    );
  }
  if (candidates.length === 0) {
    candidates = diets.filter(d =>
      d.season.includes(currentSeason) &&
      !d.avoid.includes(con.primary) &&
      !checkDislikes(d, dislikes)
    );
  }

  // 冲突驱动排序
  candidates.sort((a, b) =>
    scoreDietForConflicts(b, currentConflictAnalysis, con) -
    scoreDietForConflicts(a, currentConflictAnalysis, con)
  );
  const results = candidates.slice(0, 3);

  // 视图
  document.getElementById("quizSection").style.display = "none";
  document.getElementById("resultSection").style.display = "block";

  let constText = con.primary;
  if (con.secondary) constText += `，兼夹倾向：${con.secondary}`;
  document.getElementById("constitutionResult").innerHTML =
    `${constText}<br><small>${CONST_PLAIN[con.primary] || ''}</small>`;

  // 指导面板
  const g = getPlainGuidance(wylq, currentWeather, cInfo);
  let guideHtml = '';

  // 展示冲突如何影响推荐
  const a = currentConflictAnalysis;
  const reasons = [];

  if (a.weatherDeviation && a.weatherDeviation.hasDeviation && a.weatherDeviation.level === 'high') {
    reasons.push(`<div class="reason-item warning">
      <span class="reason-icon">⚠️</span>
      <div><strong>天气反常——优先级最高</strong>
      <p>${a.weatherDeviation.message}</p></div>
    </div>`);
  }
  if (a.migrationConflict && a.migrationConflict.level !== 'low') {
    reasons.push(`<div class="reason-item">
      <span class="reason-icon">🚨</span>
      <div><strong>水土不服</strong>
      <p>${a.migrationConflict.body?.slice(0, 80)}...</p></div>
    </div>`);
  }
  if (a.constConflict) {
    reasons.push(`<div class="reason-item">
      <span class="reason-icon">🧬</span>
      <div><strong>体质×环境</strong>
      <p>${a.constConflict.note}</p></div>
    </div>`);
  }
  if (a.foodClash) {
    reasons.push(`<div class="reason-item">
      <span class="reason-icon">🍽</span>
      <div><strong>饮食习惯冲突</strong>
      <p>${a.foodClash.note}</p></div>
    </div>`);
  }
  if (a.priorityEvils && a.priorityEvils.length > 0) {
    reasons.push(`<div class="reason-item">
      <span class="reason-icon">🎯</span>
      <div><strong>当前调理优先级</strong>
      <p>${a.priorityEvils.map(e => `${e}邪`).join(' → ')}</p></div>
    </div>`);
  }

  guideHtml = reasons.length > 0
    ? reasons.join('')
    : '<p>✅ 没有明显冲突，按季节和体质常规推荐即可</p>';

  document.getElementById("guideBody").innerHTML = guideHtml;

  // 药膳
  const cardsDiv = document.getElementById("dietCards");
  cardsDiv.innerHTML = "";
  if (results.length === 0) {
    cardsDiv.innerHTML = "<p>😔 暂无完全匹配的药膳，请调整偏好或等待知识库更新。</p>";
  } else {
    results.forEach(d => {
      const score = scoreDietForConflicts(d, currentConflictAnalysis, con);
      let whyText = '';
      if (score >= 6) whyText = '这道强烈推荐——同时针对了天气反常、水土不服和你的体质';
      else if (score >= 4) whyText = '这道针对了你的关键冲突点，建议优先考虑';
      else if (score >= 2) whyText = '这道和你的体质或当前环境比较匹配';

      const card = document.createElement("div");
      card.className = "diet-card";
      card.innerHTML = `
        <h3>🍲 ${d.name} ${score >= 4 ? '<span class="qi-badge hot">强烈推荐</span>' : score >= 2 ? '<span class="qi-badge">推荐</span>' : ''}</h3>
        ${whyText ? `<p class="match-reason">💡 ${whyText}</p>` : ''}
        <p><strong>食材：</strong>${d.ingredients}</p>
        <p><strong>做法：</strong>${d.method}</p>
        <p><strong>功效：</strong>${d.effect}</p>
        <div class="risk">
          ⚠️ <strong>注意：</strong><br>${d.risk}<br>
          🚫 <strong>不适合：</strong>${d.ban}
        </div>`;
      cardsDiv.appendChild(card);
    });
  }
});

// ========== 返回 ==========
document.getElementById("backBtn").addEventListener("click", function() {
  document.getElementById("quizSection").style.display = "block";
  document.getElementById("resultSection").style.display = "none";
  window.scrollTo(0, 0);
});
