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
let plainGuide = getPlainGuidance(wylq, null, null);

// ========== 卡片emoji ==========
const emojiMap = {
  '风': '🌬', '热': '🔥', '暑': '☀️', '湿': '💧', '燥': '🍂', '寒': '❄️',
};

// ========== 渲染顶部健康卡片 ==========
function renderHealthCard(guide) {
  const g = guide;
  const e = emojiMap[wylq.currentQi.keInfo.evil] || '🌿';

  document.getElementById("cardEmoji").textContent = e;
  document.getElementById("cardHeadline").textContent = g.headline;
  document.getElementById("cardSub").textContent =
    `${wylq.currentQi.dateRange} · ${wylq.currentQi.name}`;

  document.getElementById("bodySignals").innerHTML = g.bodySignals
    .map(s => `<span class="signal-tag">${s}</span>`).join('');

  document.getElementById("doList").innerHTML = g.doList
    .map((s, i) => `<div class="do-item"><span class="do-num">${i+1}</span>${s}</div>`)
    .join('');

  document.getElementById("eatList").innerHTML = g.eatList
    .map(f => `<span class="food-tag eat-tag">${f}</span>`).join('');
  document.getElementById("avoidList").innerHTML = g.avoidList
    .map(f => `<span class="food-tag avoid-tag">${f}</span>`).join('');

  // "为什么"折叠区
  const t = g.tcmDetail;
  let whyHtml = `<p><strong>${g.why}</strong></p>`;
  if (g.interaction) whyHtml += `<p>💡 ${g.interaction}</p>`;
  if (g.yearNote) whyHtml += `<p>📅 ${g.yearNote}</p>`;
  whyHtml += `
    <div class="tcm-footnote">
      <span>${t.ganZhi}年</span> · <span>岁运：${t.suiYun}</span> · <span>司天：${t.siTian}</span> · <span>在泉：${t.zaiQuan}</span><br>
      <span>${t.qiName} · 主气：${t.zhuQi} · 客气：${t.keQi}</span>
    </div>`;
  document.getElementById("whyContent").innerHTML = whyHtml;
}

renderHealthCard(plainGuide);

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

// ========== 城市 ==========
const citySelect = document.getElementById("citySelect");
Object.keys(cityData).sort().forEach(c => {
  const o = document.createElement("option");
  o.value = c; o.textContent = c;
  citySelect.appendChild(o);
});

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

// ========== 城市选择 → 天气 + 气候 ==========
citySelect.addEventListener("change", async function() {
  const info = cityData[this.value];
  if (!info) {
    document.getElementById("climateNote").textContent = "";
    document.getElementById("weatherMini").style.display = "none";
    return;
  }

  // 气候大白话
  const cn = getClimatePlain(info.region);
  document.getElementById("climateNote").innerHTML = `<span class="cn-icon">📍</span> ${cn}`;

  // 获取天气
  const weather = await fetchWeather(info.lat, info.lon);
  const mini = document.getElementById("weatherMini");

  if (weather) {
    // 更新全局指引
    plainGuide = getPlainGuidance(wylq, weather, info);
    renderHealthCard(plainGuide);

    const wg = plainGuide.weatherGuide;
    mini.style.display = "block";
    document.getElementById("weatherIcon").textContent = WMO_CODES[weather.weatherCode] || "🌡";
    document.getElementById("weatherSummary").textContent =
      `${this.value} ${weather.temp}°C · 体感${weather.feelsLike}°C · 湿度${weather.humidity}%`;

    const devDiv = document.getElementById("weatherDeviation");
    if (wg && wg.deviation.length > 0) {
      devDiv.innerHTML = wg.deviation.map(d => `<p>⚠️ ${d}</p>`).join('');
      devDiv.style.display = "block";
    } else {
      devDiv.style.display = "none";
    }
  } else {
    mini.style.display = "block";
    document.getElementById("weatherIcon").textContent = "⚠️";
    document.getElementById("weatherSummary").textContent = "天气数据暂时获取失败，请检查网络";
    document.getElementById("weatherDeviation").style.display = "none";
  }
});

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

// ========== 运气匹配 ==========
function scoreDietForQi(diet) {
  if (!diet.qiEvil || diet.qiEvil.length === 0) return 0;
  const keEvil = wylq.currentQi.keInfo.evil;
  if (diet.qiEvil.includes(keEvil)) return 2;
  for (let e of diet.qiEvil) { if (EVIL_WUXING[e] === EVIL_WUXING[keEvil]) return 1; }
  return 0;
}

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

// ========== 推荐 ==========
document.getElementById("submitBtn").addEventListener("click", function() {
  const con = determineConstitution();
  const city = citySelect.value;
  const info = cityData[city];
  if (!city || !info) { alert("请选择您的常驻城市"); return; }

  const region = info.region;
  const checkboxes = document.querySelectorAll('#preferences input[type="checkbox"]:checked');
  const dislikes = Array.from(checkboxes).map(cb => cb.value);

  let candidates = diets.filter(d =>
    d.season.includes(currentSeason) &&
    d.region.includes(region) &&
    d.target.includes(con.primary) &&
    !d.avoid.includes(con.primary) &&
    !checkDislikes(d, dislikes)
  );
  if (candidates.length === 0) {
    candidates = diets.filter(d =>
      d.season.includes(currentSeason) &&
      d.region.includes(region) &&
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

  candidates.sort((a, b) => scoreDietForQi(b) - scoreDietForQi(a));
  const results = candidates.slice(0, 3);

  // 切换视图
  document.getElementById("quizSection").style.display = "none";
  document.getElementById("resultSection").style.display = "block";

  let constText = con.primary;
  if (con.secondary) constText += `，兼夹倾向：${con.secondary}`;
  document.getElementById("constitutionResult").innerHTML =
    `${constText}<br><small>${CONST_PLAIN[con.primary] || ''}</small>`;

  // 指导面板
  const g = plainGuide;
  const qi = wylq.currentQi;
  document.getElementById("guideHeadline").textContent =
    `你的体质 + 当前天气 + 运气 = 调养方向`;

  document.getElementById("guideBody").innerHTML = `
    <div class="guide-row">
      <div class="guide-item">
        <span class="guide-emoji">🧬</span>
        <strong>你的体质</strong>
        <p>${CONST_PLAIN[con.primary] || ''}</p>
      </div>
      <div class="guide-item">
        <span class="guide-emoji">${emojiMap[qi.keInfo.evil] || '🌿'}</span>
        <strong>这段时间</strong>
        <p>${g.headline}</p>
      </div>
    </div>
    ${g.climateNote ? `<p class="guide-climate">📍 ${g.climateNote}</p>` : ''}
    <div class="guide-eat">
      <span>🍽 推荐吃：</span>${g.eatList.map(f => `<span class="food-tag eat-tag">${f}</span>`).join(' ')}
    </div>
  `;

  // 药膳
  const cardsDiv = document.getElementById("dietCards");
  cardsDiv.innerHTML = "";
  if (results.length === 0) {
    cardsDiv.innerHTML = "<p>😔 暂无完全匹配的药膳，请调整偏好或等待知识库更新。</p>";
  } else {
    results.forEach(d => {
      const qiScore = scoreDietForQi(d);
      const card = document.createElement("div");
      card.className = "diet-card";
      card.innerHTML = `
        <h3>🍲 ${d.name} ${qiScore > 0 ? '<span class="qi-badge">应季推荐</span>' : ''}</h3>
        ${qiScore > 0 ? `<p class="match-reason">💡 这道药膳适合现在吃，因为当前${g.headline}，它的${d.effect}</p>` : ''}
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
