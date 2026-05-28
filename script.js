// ========== 吾乡帖 · 主逻辑 ==========

// 季节
const seasonMonths = { "春":[2,3,4],"夏":[5,6,7],"长夏":[8],"秋":[9,10,11],"冬":[12,1] };
function getCurrentSeason() {
  const m = new Date().getMonth()+1;
  for (let [s, ms] of Object.entries(seasonMonths)) if (ms.includes(m)) return s;
  return "春";
}
const currentSeason = getCurrentSeason();

// 五运六气
const wylq = getCurrentWYLQ();
const qi = wylq.currentQi;

const emojiMap = { '风':'🌬','热':'🔥','暑':'☀️','湿':'💧','燥':'🍂','寒':'❄️' };

// ========== 体质测评：28题 × 9组 ==========
const constGroups = [
  {
    key:"平和质", label:"😊 平和相关", active:true,
    questions: [
      { key:"ph1", text:"您精力充沛，很少感到疲劳吗？" },
      { key:"ph2", text:"您面色红润、气色好吗？" },
      { key:"ph3", text:"您睡眠质量好吗？很少失眠？" },
      { key:"ph4", text:"您适应能力（换季、出差等）强吗？" },
    ],
  },
  {
    key:"气虚质", label:"😮‍💨 气虚相关", active:false,
    questions: [
      { key:"qx1", text:"您容易疲乏、总想休息吗？" },
      { key:"qx2", text:"您说话声音低弱无力吗？" },
      { key:"qx3", text:"您稍微活动就容易出汗吗？" },
    ],
  },
  {
    key:"阳虚质", label:"🥶 阳虚相关", active:false,
    questions: [
      { key:"yx1", text:"您比别人怕冷、手脚发凉吗？" },
      { key:"yx2", text:"您吃凉的或生冷食物肠胃会不舒服吗？" },
      { key:"yx3", text:"您冬天比别人穿得多还是觉得冷吗？" },
    ],
  },
  {
    key:"阴虚质", label:"🔥 阴虚相关", active:false,
    questions: [
      { key:"yinx1", text:"您手心脚心发热、下午容易潮热吗？" },
      { key:"yinx2", text:"您口干舌燥、总想喝水吗？" },
      { key:"yinx3", text:"您大便干结、容易便秘吗？" },
    ],
  },
  {
    key:"痰湿质", label:"💨 痰湿相关", active:false,
    questions: [
      { key:"ts1", text:"您感觉身体沉重、像裹了湿布一样不爽快吗？" },
      { key:"ts2", text:"您腹部松软、比同龄人容易发胖吗？" },
      { key:"ts3", text:"您嗓子总觉得有痰或黏腻感吗？" },
    ],
  },
  {
    key:"湿热质", label:"🌡 湿热相关", active:false,
    questions: [
      { key:"sr1", text:"您面部或头发容易出油吗？" },
      { key:"sr2", text:"您口苦、口臭或口腔有异味吗？" },
      { key:"sr3", text:"您大便粘滞、冲不干净马桶吗？" },
    ],
  },
  {
    key:"血瘀质", label:"🩸 血瘀相关", active:false,
    questions: [
      { key:"xyu1", text:"您身上容易出现瘀斑（青一块紫一块）吗？" },
      { key:"xyu2", text:"您面色或口唇偏暗、没有光泽吗？" },
      { key:"xyu3", text:"您身体某处有固定的刺痛感吗？" },
    ],
  },
  {
    key:"气郁质", label:"😔 气郁相关", active:false,
    questions: [
      { key:"qy1", text:"您经常觉得闷闷不乐、情绪低落吗？" },
      { key:"qy2", text:"您容易紧张、焦虑不安吗？" },
      { key:"qy3", text:"您两胁胀痛或乳房胀痛吗（与情绪相关）？" },
    ],
  },
  {
    key:"特禀质", label:"🤧 特禀相关", active:false,
    questions: [
      { key:"tb1", text:"您容易过敏（药物、食物、花粉等）吗？" },
      { key:"tb2", text:"您有过敏性鼻炎、哮喘或皮肤荨麻疹吗？" },
      { key:"tb3", text:"您换季或换环境时容易打喷嚏、流鼻涕吗？" },
    ],
  },
];

// 渲染题目
const questionsDiv = document.getElementById("questions");
constGroups.forEach((g, gi) => {
  const wrapper = document.createElement("div");
  wrapper.className = "const-group";
  wrapper.id = "group_" + g.key;

  const head = document.createElement("div");
  head.className = "group-head";
  head.innerHTML = `<span>${g.label}</span><span class="group-status" id="status_${g.key}"></span>`;
  wrapper.appendChild(head);

  g.questions.forEach((q, qi) => {
    const div = document.createElement("div");
    div.className = "question-item";
    div.innerHTML = `
      <label>${q.text}</label>
      <div class="slider-container">
        <span>1</span>
        <input type="range" min="1" max="5" value="1" id="q_${q.key}" data-group="${g.key}">
        <span id="val_${q.key}">1</span>
      </div>`;
    wrapper.appendChild(div);
  });
  questionsDiv.appendChild(wrapper);
});

// 滑块实时 + 进度更新
let groupScores = {};
document.querySelectorAll('input[type="range"]').forEach(s => {
  s.addEventListener("input", function() {
    const vid = document.getElementById("val_"+this.id.replace("q_",""));
    if (vid) vid.textContent = this.value;
    updateGroupProgress(this.dataset.group);
    updateQuizProgress();
  });
});

function updateGroupProgress(groupKey) {
  const group = constGroups.find(g => g.key === groupKey);
  if (!group) return;
  const inputs = document.querySelectorAll(`input[data-group="${groupKey}"]`);
  let total = 0;
  inputs.forEach(inp => total += parseInt(inp.value));
  const avg = total / inputs.length;
  const statusEl = document.getElementById("status_" + groupKey);
  if (!statusEl) return;
  if (avg >= 3.5) { statusEl.textContent = "✓ 明显"; statusEl.className = "group-status high"; }
  else if (avg >= 2.5) { statusEl.textContent = "△ 有倾向"; statusEl.className = "group-status mid"; }
  else { statusEl.textContent = "— 不明显"; statusEl.className = "group-status low"; }
}

function updateQuizProgress() {
  let filled = 0;
  constGroups.forEach(g => {
    const inputs = document.querySelectorAll(`input[data-group="${g.key}"]`);
    let touched = false;
    inputs.forEach(inp => { if (parseInt(inp.value) !== 1) touched = true; });
    if (touched) filled++;
  });
  document.getElementById("progressFill").style.width = (filled / 9 * 100) + "%";
  document.getElementById("progressText").textContent = filled + "/9 组完成";
  document.getElementById("quizProgress").style.display = "block";
}

// ========== 体质判定 ==========
function determineConstitution() {
  const scores = {};
  constGroups.forEach(g => {
    const inputs = document.querySelectorAll(`input[data-group="${g.key}"]`);
    let total = 0;
    inputs.forEach(inp => total += parseInt(inp.value));
    scores[g.key] = total / inputs.length; // 均分 1-5
  });

  const phAvg = scores["平和质"];

  // 全低分检测
  const allAvgs = Object.values(scores);
  const maxAvg = Math.max(...allAvgs);
  if (maxAvg < 2) {
    return { primary: null, scores, lowQuality: true };
  }

  // 平和质 = 积极诊断
  const otherAvgs = Object.entries(scores).filter(([k]) => k !== "平和质").map(([,v]) => v);
  const otherMax = Math.max(...otherAvgs);
  if (phAvg >= 3.5 && otherMax < 2.5) {
    return { primary: "平和质", secondary: null, scores, isBalanced: true };
  }

  // 偏颇质判定
  let primary = "平和质", maxS = 0;
  for (let [k, v] of Object.entries(scores)) {
    if (k === "平和质") continue;
    if (v > maxS) { maxS = v; primary = k; }
  }
  let secondary = null, s2 = 0;
  for (let [k, v] of Object.entries(scores)) {
    if (k === "平和质" || k === primary) continue;
    if (v >= 2.5 && v > s2) { s2 = v; secondary = k; }
  }

  return { primary, secondary, scores, isBalanced: false };
}

// ========== 体质大白话 ==========
const CONST_PLAIN = {
  '平和质': '体质均衡，继续保持',
  '气虚质': '容易累、气不够用——像手机电量总在20%以下，需要"充电"',
  '阳虚质': '怕冷、火力不足——像冬天暖气不够热，需要"加温"',
  '阴虚质': '身体水分不足——像锅里的水快烧干了，需要"加水"',
  '痰湿质': '代谢慢、湿气重——像排水管堵了，需要"疏通"',
  '湿热质': '又湿又热——像闷热的桑拿天，需要"清热除湿"',
  '血瘀质': '循环不畅——像水管有沉积物，需要"活血"',
  '气郁质': '气机不顺，容易闷——像琴弦绷太紧，需要"疏解"',
  '特禀质': '天生敏感——像对花粉灰尘都起反应的猫，需要"保护"',
};

// ========== 省→市两级选择器 ==========
const provinceList = Object.keys(provinceCities).sort();
function fillProvinceSelect(id) {
  const sel = document.getElementById(id);
  provinceList.forEach(p => { const o = document.createElement("option"); o.value = p; o.textContent = p; sel.appendChild(o); });
}
fillProvinceSelect("hometownProvince");
fillProvinceSelect("currentProvince");

function populateCitySelect(provinceId, cityId) {
  const prov = document.getElementById(provinceId).value;
  const citySel = document.getElementById(cityId);
  citySel.innerHTML = "";
  if (!prov || !provinceCities[prov]) {
    citySel.appendChild(new Option("-- 先选省份 --", ""));
    return;
  }
  citySel.appendChild(new Option("-- 选择城市 --", ""));
  const cities = [...provinceCities[prov]].sort();
  cities.forEach(c => {
    if (cityData[c]) citySel.appendChild(new Option(c, c));
  });
}

document.getElementById("hometownProvince").addEventListener("change", () => populateCitySelect("hometownProvince", "hometownCity"));
document.getElementById("currentProvince").addEventListener("change", () => populateCitySelect("currentProvince", "currentCity"));

const hometownCitySelect = document.getElementById("hometownCity");
const currentCitySelect = document.getElementById("currentCity");
let currentWeather = null, currentConflictAnalysis = null;

// ========== 天气缓存 ==========
const weatherCache = {};
async function fetchWeather(lat, lon) {
  const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
  if (weatherCache[key] && (Date.now() - weatherCache[key].ts) < 30*60*1000) return weatherCache[key].data;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FShanghai&forecast_days=5`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error("API err");
    const j = await r.json();
    const d = { temp: j.current.temperature_2m, feelsLike: j.current.apparent_temperature, humidity: j.current.relative_humidity_2m, windSpeed: j.current.wind_speed_10m, weatherCode: j.current.weather_code, daily: j.daily };
    weatherCache[key] = { data: d, ts: Date.now() };
    return d;
  } catch(e) { console.warn("天气API:", e.message); return null; }
}

// ========== 城市选择联动 → 水土差异分析 ==========
async function onCityChange() {
  const hCity = hometownCitySelect.value;
  const cCity = currentCitySelect.value;
  const hInfo = cityData[hCity];
  const cInfo = cityData[cCity];

  // 家乡标签
  const hTag = document.getElementById("hometownTag");
  if (hInfo) {
    const hf = REGION_FOOD_CULTURE[hInfo.region];
    hTag.style.display = "block";
    hTag.innerHTML = `你的身体底子：<strong>${hf ? hf.taste : ''} · ${getClimatePlain(hInfo.region).split('，')[0]}</strong>`;
  } else { hTag.style.display = "none"; }

  // 现居地标签
  const cTag = document.getElementById("currentTag");
  if (cInfo) {
    const cf = REGION_FOOD_CULTURE[cInfo.region];
    cTag.style.display = "block";
    cTag.innerHTML = `当地特点：<strong>${cf ? cf.taste : ''} · ${getClimatePlain(cInfo.region).split('，')[0]}</strong>`;
  } else { cTag.style.display = "none"; }

  // 水土差异分析
  const analysisDiv = document.getElementById("migrationAnalysis");
  if (!cInfo) { analysisDiv.style.display = "none"; return; }

  currentWeather = await fetchWeather(cInfo.lat, cInfo.lon);

  if (hInfo && hInfo.region !== cInfo.region) {
    const conflict = getClimateConflict(hInfo.region, cInfo.region);
    if (conflict && conflict.level !== 'low') {
      analysisDiv.style.display = "block";
      analysisDiv.innerHTML = `
        <div class="ma-head">🚨 ${conflict.title}</div>
        <p class="ma-body">${conflict.body}</p>
        <div class="ma-tips">${conflict.tips.map(t => `<span class="ma-tip">${t}</span>`).join('')}</div>`;
    } else { analysisDiv.style.display = "none"; }
  } else if (hInfo && hInfo.region === cInfo.region) {
    analysisDiv.style.display = "block";
    analysisDiv.innerHTML = `<div class="ma-ok">✅ 家乡和现居地气候相近，水土适应的压力不大。</div>`;
  } else { analysisDiv.style.display = "none"; }
}

hometownCitySelect.addEventListener("change", onCityChange);
currentCitySelect.addEventListener("change", onCityChange);

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

  // 取前10进候选池，随机抽3
  const pool = candidates.slice(0, Math.min(10, candidates.length));
  shuffleArray(pool);
  const results = pool.slice(0, 3);

  // 视图
  document.getElementById("mainSection").style.display = "none";
  document.getElementById("resultSection").style.display = "block";

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

  if (a.weatherDeviation && a.weatherDeviation.hasDeviation && a.weatherDeviation.level === 'high') {
    guideHtml += `<div class="reason-item warning"><span class="reason-icon">⚠️</span><div><strong>天气反常——优先级最高</strong><p>${a.weatherDeviation.message}</p></div></div>`;
  }
  if (a.migrationConflict && a.migrationConflict.level !== 'low') {
    guideHtml += `<div class="reason-item"><span class="reason-icon">🚨</span><div><strong>水土不服</strong><p>${a.migrationConflict.body?.slice(0, 80)}...</p></div></div>`;
  }
  if (a.constConflict) {
    guideHtml += `<div class="reason-item"><span class="reason-icon">🧬</span><div><strong>体质×环境</strong><p>${a.constConflict.note}</p></div></div>`;
  }
  if (a.foodClash) {
    guideHtml += `<div class="reason-item"><span class="reason-icon">🍽</span><div><strong>饮食习惯冲突</strong><p>${a.foodClash.note}</p></div></div>`;
  }
  if (prefWarnings.length > 0) {
    prefWarnings.forEach(w => {
      guideHtml += `<div class="reason-item warning"><span class="reason-icon">💡</span><div><strong>饮食偏好预警</strong><p>${w}</p></div></div>`;
    });
  }
  if (a.priorityEvils && a.priorityEvils.length > 0) {
    guideHtml += `<div class="reason-item"><span class="reason-icon">🎯</span><div><strong>当前调理优先级</strong><p>${a.priorityEvils.map(e => `${e}邪`).join(' → ')}</p></div></div>`;
  }
  if (!guideHtml) guideHtml = '<p>✅ 没有明显冲突，按季节和体质常规推荐即可</p>';
  document.getElementById("guideBody").innerHTML = guideHtml;

  // 运气背景
  const e = emojiMap[qi.keInfo.evil] || '🌿';
  document.getElementById("contextHead").innerHTML = `${e} 当前运气 · ${qi.dateRange}`;
  document.getElementById("contextBody").innerHTML = `
    <div class="context-summary"><strong>${g.headline}</strong></div>
    <div class="context-grid">
      <div class="cg-item"><span class="cg-label">身体容易</span><span class="cg-val">${g.bodySignals.slice(0,3).join('、')}</span></div>
      <div class="cg-item"><span class="cg-label">饮食方向</span><span class="cg-val eat">多吃 ${g.eatList.slice(0,4).join('、')}</span><span class="cg-val avoid">少碰 ${g.avoidList.slice(0,3).join('、')}</span></div>
    </div>
    ${g.climateNote ? `<p class="context-note">📍 ${g.climateNote}</p>` : ''}
    ${g.yearNote ? `<p class="context-note">📅 ${g.yearNote}</p>` : ''}
    ${g.interaction ? `<p class="context-note">💡 ${g.interaction}</p>` : ''}
    <details class="context-detail"><summary>运气原文</summary><div class="tcm-footnote">${wylq.pattern.ganZhi}年 · 岁运：${wylq.pattern.suiYun} · 司天：${wylq.pattern.siTian} · 在泉：${wylq.pattern.zaiQuan}<br>${qi.name} · 主气：${qi.zhuQi} · 客气：${qi.keQi}</div></details>
  `;

  // 药膳
  const cardsDiv = document.getElementById("dietCards");
  cardsDiv.innerHTML = "";
  document.getElementById("refreshHint").style.display = "block";

  if (results.length === 0) {
    cardsDiv.innerHTML = "<p>😔 暂无匹配的药膳，请调整偏好。</p>";
  } else {
    results.forEach(d => {
      const card = document.createElement("div");
      card.className = "diet-card";
      const score = d._score || 0;
      const badge = score >= 6 ? '<span class="qi-badge hot">强烈推荐</span>' : score >= 3 ? '<span class="qi-badge">推荐</span>' : '';
      card.innerHTML = `
        <h3>🍲 ${d.name} ${badge}</h3>
        <p class="taste-hint">👅 口感：${d.taste || '好入口'}</p>
        <p><strong>食材：</strong>${d.ingredients}</p>
        <p><strong>做法：</strong>${d.method}</p>
        <p><strong>功效：</strong>${d.effect}</p>
        <div class="risk">⚠️ <strong>注意：</strong><br>${d.risk}<br>🚫 <strong>不适合：</strong>${d.ban}</div>`;
      cardsDiv.appendChild(card);
    });
  }
});

// ========== 分数条 ==========
function renderScoreBars(scores) {
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return entries.map(([k, v]) => {
    const pct = Math.min(v / 5 * 100, 100);
    const label = k.replace('质','');
    const color = k === '平和质' ? 'bar-green' : v >= 3 ? 'bar-red' : v >= 2.5 ? 'bar-orange' : 'bar-gray';
    return `<div class="score-bar"><span class="sb-label">${label}</span><div class="sb-track"><div class="sb-fill ${color}" style="width:${pct}%"></div></div><span class="sb-val">${v.toFixed(1)}</span></div>`;
  }).join('');
}

// ========== 随机 ==========
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ========== 返回 ==========
document.getElementById("backBtn").addEventListener("click", function() {
  document.getElementById("mainSection").style.display = "block";
  document.getElementById("resultSection").style.display = "none";
  window.scrollTo(0, 0);
});
