// ========== 季节判定 ==========
const seasonMonths = {
  "春": [2,3,4], "夏": [5,6,7], "长夏": [8], "秋": [9,10,11], "冬": [12,1]
};

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  for (let [season, months] of Object.entries(seasonMonths)) {
    if (months.includes(month)) return season;
  }
  return "春";
}

const currentSeason = getCurrentSeason();

// ========== 初始化五运六气面板 ==========
const wylq = getCurrentWYLQ();
document.getElementById("seasonHint").textContent =
  `📅 ${currentSeason}季 · ${wylq.pattern.ganZhi}年 · ${wylq.pattern.suiYun} · ${wylq.currentQi.name}`;

function renderWYLQPanel() {
  const w = wylq;
  const p = w.pattern;
  const q = w.currentQi;

  document.getElementById("wylqContent").innerHTML = `
    <div class="wylq-year">
      <strong>${p.ganZhi}年</strong>
      <span class="tag tag-yun">岁运：${p.suiYun}</span>
      <span class="tag tag-sitian">司天：${p.siTian}</span>
      <span class="tag tag-zaiquan">在泉：${p.zaiQuan}</span>
    </div>
    <div class="wylq-current">
      <div class="qi-line"><strong>当前：${q.name}</strong> <span class="qi-date">${q.dateRange}</span></div>
      <div class="qi-detail">
        <div class="qi-item zhu">
          <span class="qi-label">主气</span>
          <span class="qi-val">${q.zhuQi}（${q.zhuWx}）</span>
          <span class="qi-desc">${q.zhuInfo.tend}</span>
        </div>
        <div class="qi-item ke">
          <span class="qi-label">客气</span>
          <span class="qi-val">${q.keQi}（${q.keWx}）</span>
          <span class="qi-desc">${q.keInfo.tend}</span>
        </div>
      </div>
      <p class="qi-tip">⚠ ${q.keInfo.evil}邪偏盛 · 易伤${q.keInfo.organ} · ${WUXING_ADVICE[QI_WUXING[q.keQi]]?.zang || ''}${WUXING_ADVICE[QI_WUXING[q.keQi]]?.fu || ''}当令</p>
    </div>
    <details class="all-qi-details">
      <summary>📋 查看全年六气格局</summary>
      <div class="all-qi-table">
        ${w.allQi.map((qi, i) => `
          <div class="qi-row ${qi.name === q.name ? 'active' : ''}">
            <div class="qi-row-name">${qi.name}</div>
            <div class="qi-row-date">${qi.dateRange}</div>
            <div class="qi-row-qi">主${qi.zhuQi.split('').slice(0,2).join('')} · 客${qi.keQi.split('').slice(0,2).join('')}</div>
          </div>
        `).join('')}
      </div>
    </details>
  `;
}

renderWYLQPanel();

// ========== 体质问卷 ==========
const questions = [
  { key: "平和质", text: "您是否精力充沛、面色红润、睡眠良好？" },
  { key: "气虚质", text: "您是否容易疲劳、气短、说话声音低弱？" },
  { key: "阳虚质", text: "您是否怕冷、手脚发凉、喜欢热饮？" },
  { key: "阴虚质", text: "您是否手心发热、口干咽燥、偏好冷饮？" },
  { key: "痰湿质", text: "您是否感觉身体沉重、腹部肥满、舌苔厚腻？" },
  { key: "湿热质", text: "您是否面部油腻、口苦口臭、大便粘滞？" },
  { key: "血瘀质", text: "您是否肤色晦暗、容易出现瘀斑、身体有刺痛？" },
  { key: "气郁质", text: "您是否情绪低落、容易紧张焦虑、胸闷胁胀？" },
  { key: "特禀质", text: "您是否容易过敏、打喷嚏、有哮喘或皮肤问题？" }
];

const questionsDiv = document.getElementById("questions");
questions.forEach((q, index) => {
  const div = document.createElement("div");
  div.className = "question-item";
  div.innerHTML = `
    <label>${index+1}. ${q.text}</label>
    <div class="slider-container">
      <span>1</span>
      <input type="range" min="1" max="5" value="1" id="q_${q.key}">
      <span id="val_${q.key}">1</span>
    </div>
  `;
  questionsDiv.appendChild(div);
});

document.querySelectorAll('input[type="range"]').forEach(slider => {
  slider.addEventListener("input", function() {
    const valSpan = document.getElementById("val_" + this.id.replace("q_",""));
    if (valSpan) valSpan.textContent = this.value;
  });
});

// ========== 城市下拉框 ==========
const citySelect = document.getElementById("citySelect");
const sortedCities = Object.keys(cityData).sort();
sortedCities.forEach(city => {
  const option = document.createElement("option");
  option.value = city;
  option.textContent = city;
  citySelect.appendChild(option);
});

// ========== 天气缓存 ==========
const weatherCache = {};

async function fetchWeather(lat, lon) {
  const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
  const now = Date.now();
  if (weatherCache[key] && (now - weatherCache[key].ts) < 30 * 60 * 1000) {
    return weatherCache[key].data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean&timezone=Asia%2FShanghai&forecast_days=5`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) throw new Error("API error");
    const json = await resp.json();
    const data = {
      temp: json.current.temperature_2m,
      feelsLike: json.current.apparent_temperature,
      humidity: json.current.relative_humidity_2m,
      windSpeed: json.current.wind_speed_10m,
      weatherCode: json.current.weather_code,
      daily: json.daily,
      ts: now,
    };
    weatherCache[key] = { data, ts: now };
    return data;
  } catch (e) {
    console.warn("天气API获取失败:", e.message);
    return null;
  }
}

const WMO_CODES = {
  0:"☀️ 晴天", 1:"🌤 少云", 2:"⛅ 多云", 3:"☁️ 阴天",
  45:"🌫 有雾", 48:"🌫 浓雾",
  51:"🌧 小毛毛雨", 53:"🌧 毛毛雨", 55:"🌧 大毛毛雨",
  61:"🌧 小雨", 63:"🌧 中雨", 65:"🌧 大雨",
  71:"🌨 小雪", 73:"🌨 中雪", 75:"🌨 大雪",
  80:"🌦 阵雨", 81:"🌦 大阵雨", 82:"⛈ 暴阵雨",
  85:"🌨 阵雪", 86:"🌨 大阵雪",
  95:"⛈ 雷暴", 96:"⛈ 雷暴+冰雹", 99:"⛈ 强雷暴+冰雹",
};

// ========== 城市选择 → 更新天气面板 ==========
citySelect.addEventListener("change", async function() {
  const city = this.value;
  const info = cityData[city];
  if (!info) {
    document.getElementById("regionResult").textContent = "";
    document.getElementById("cityWylqNote").textContent = "";
    document.getElementById("weatherPanel").style.display = "none";
    return;
  }

  document.getElementById("regionResult").textContent = `🌍 气候区：${info.region}`;

  // 显示城市 + 当前运气的叠加描述
  const qi = wylq.currentQi;
  const climateInfo = CLIMATE_DESC[info.region] || { base:'', riskAdd:'' };
  document.getElementById("cityWylqNote").innerHTML =
    `<span class="note-tag">📌 ${info.region}</span> ${climateInfo.base} · ${climateInfo.riskAdd}`;

  // 获取天气
  const weather = await fetchWeather(info.lat, info.lon);
  const weatherPanel = document.getElementById("weatherPanel");
  weatherPanel.style.display = "block";

  const weatherContent = document.getElementById("weatherContent");
  if (!weather) {
    weatherContent.innerHTML = '<p class="muted">⚠️ 天气数据暂时无法获取，请检查网络后刷新</p>';
    return;
  }

  // 运气 vs 天气分析
  const analysis = analyzeQiVsWeather(wylq, weather, info.region);

  weatherContent.innerHTML = `
    <div class="weather-now">
      <div class="weather-main">
        <span class="weather-icon">${WMO_CODES[weather.weatherCode] || "🌡"}</span>
        <span class="weather-temp">${weather.temp}°C</span>
        <span class="weather-feels">体感 ${weather.feelsLike}°C</span>
      </div>
      <div class="weather-stats">
        <span>💧 湿度 ${weather.humidity}%</span>
        <span>💨 风速 ${weather.windSpeed} km/h</span>
      </div>
    </div>
    <div class="weather-forecast">
      <strong>未来5日</strong>
      <div class="forecast-row">
        ${weather.daily.time.slice(0,5).map((t, i) => `
          <div class="forecast-day">
            <div class="fd-date">${t.slice(5)}</div>
            <div class="fd-temp">${weather.daily.temperature_2m_max[i]}°/${weather.daily.temperature_2m_min[i]}°</div>
            <div class="fd-rain">💧${weather.daily.precipitation_sum[i]}mm</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="weather-analysis">
      <strong>🔬 运气对照</strong>
      <p>主导邪气：<span class="evil-tag">${analysis.dominantEvil}</span></p>
      ${analysis.alerts.map(a => `<p class="alert-item">⚠️ ${a}</p>`).join('')}
      <p class="food-hint">🍽 推荐食材方向：${analysis.adviceFoods.join('、')}</p>
    </div>
  `;
});

// ========== 体质判定 ==========
function determineConstitution() {
  const scores = {};
  questions.forEach(q => {
    scores[q.key] = parseInt(document.getElementById("q_" + q.key).value);
  });

  let primary = "平和质", maxScore = 0;
  for (let [key, val] of Object.entries(scores)) {
    if (val > maxScore) { maxScore = val; primary = key; }
  }
  if (maxScore <= 2) primary = "平和质";

  let secondary = null, secondScore = 0;
  for (let [key, val] of Object.entries(scores)) {
    if (key !== primary && val >= 3 && val > secondScore) {
      secondScore = val; secondary = key;
    }
  }

  return { primary, secondary };
}

// ========== 偏好过滤 ==========
function checkDislikes(diet, dislikes) {
  const text = diet.ingredients + diet.method;
  for (let dislike of dislikes) {
    if (dislike === "素食" && /[肉鸭羊鸡排骨]/i.test(text)) return true;
    if (dislike === "忌海鲜" && /[鱼虾蟹]/i.test(text)) return true;
    if (dislike === "忌辛辣" && /[辣椒花椒蒜姜]/i.test(text)) return true;
    if (dislike === "忌羊肉" && /羊/.test(text)) return true;
    if (dislike === "忌酒" && /酒/.test(text)) return true;
  }
  return false;
}

// ========== 运气匹配加分 ==========
function scoreDietForQi(diet) {
  if (!diet.qiEvil || diet.qiEvil.length === 0) return 0;
  const keEvil = wylq.currentQi.keInfo.evil;
  if (diet.qiEvil.includes(keEvil)) return 2;
  // partial match: same wuxing
  const keWx = EVIL_WUXING[keEvil];
  for (let e of diet.qiEvil) {
    if (EVIL_WUXING[e] === keWx) return 1;
  }
  return 0;
}

// ========== 推荐逻辑 ==========
document.getElementById("submitBtn").addEventListener("click", function() {
  const constitution = determineConstitution();
  const city = citySelect.value;
  const info = cityData[city];

  if (!city || !info) {
    alert("请选择您的常驻城市");
    return;
  }

  const region = info.region;
  const checkboxes = document.querySelectorAll('#preferences input[type="checkbox"]:checked');
  const dislikes = Array.from(checkboxes).map(cb => cb.value);

  // 精确匹配
  let candidates = diets.filter(d =>
    d.season.includes(currentSeason) &&
    d.region.includes(region) &&
    d.target.includes(constitution.primary) &&
    !d.avoid.includes(constitution.primary) &&
    !checkDislikes(d, dislikes)
  );

  // 放宽：仅季节+区域+不回避
  if (candidates.length === 0) {
    candidates = diets.filter(d =>
      d.season.includes(currentSeason) &&
      d.region.includes(region) &&
      !d.avoid.includes(constitution.primary) &&
      !checkDislikes(d, dislikes)
    );
  }

  // 再放宽：仅季节+不回避
  if (candidates.length === 0) {
    candidates = diets.filter(d =>
      d.season.includes(currentSeason) &&
      !d.avoid.includes(constitution.primary) &&
      !checkDislikes(d, dislikes)
    );
  }

  // 按运气匹配度排序
  candidates.sort((a, b) => scoreDietForQi(b) - scoreDietForQi(a));

  const results = candidates.slice(0, 3);

  // 切换视图
  document.getElementById("quizSection").style.display = "none";
  document.getElementById("resultSection").style.display = "block";

  let constText = `主要体质：${constitution.primary}`;
  if (constitution.secondary) constText += `，兼夹倾向：${constitution.secondary}`;
  document.getElementById("constitutionResult").textContent = constText;
  document.getElementById("regionDisplay").textContent = `常驻城市：${city}（${region}）`;
  document.getElementById("seasonDisplay").textContent =
    `当前：${currentSeason}季 · ${wylq.pattern.ganZhi}年${wylq.currentQi.name} · 客气${wylq.currentQi.keQi}`;

  // 运气分析面板
  const qi = wylq.currentQi;
  const analysisContent = document.getElementById("analysisContent");
  analysisContent.innerHTML = `
    <div class="analysis-grid">
      <div class="analysis-item">
        <strong>客气主导</strong>
        <p>${qi.keQi}（${qi.keWx}）· ${qi.keInfo.evil}邪</p>
      </div>
      <div class="analysis-item">
        <strong>易伤脏腑</strong>
        <p>${qi.keInfo.organ} · ${WUXING_ADVICE[QI_WUXING[qi.keQi]]?.zang || ''}${WUXING_ADVICE[QI_WUXING[qi.keQi]]?.fu || ''}</p>
      </div>
      <div class="analysis-item">
        <strong>气候背景</strong>
        <p>${CLIMATE_DESC[region]?.base || ''}</p>
      </div>
      <div class="analysis-item">
        <strong>运气倾向</strong>
        <p>${qi.keInfo.tend}</p>
      </div>
    </div>
    <div class="analysis-recs">
      <p>🍽 <strong>推荐食材方向：</strong>${(WUXING_ADVICE[QI_WUXING[qi.keQi]]?.foods || []).join('、')}</p>
      <p>⚠️ <strong>慎食：</strong>${WUXING_ADVICE[QI_WUXING[qi.keQi]]?.avoid || '无特殊禁忌'}</p>
    </div>
  `;

  // 药膳卡片
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
        <h3>🍲 ${d.name} ${qiScore > 0 ? '<span class="qi-badge">运气推荐</span>' : ''}</h3>
        <p><strong>食材：</strong>${d.ingredients}</p>
        <p><strong>做法：</strong>${d.method}</p>
        <p><strong>功效：</strong>${d.effect}</p>
        <div class="risk">
          ⚠️ <strong>风险与禁忌：</strong><br>
          ${d.risk}<br>
          🚫 <strong>禁用人群：</strong>${d.ban}
        </div>
      `;
      cardsDiv.appendChild(card);
    });
  }
});

// ========== 返回按钮 ==========
document.getElementById("backBtn").addEventListener("click", function() {
  document.getElementById("quizSection").style.display = "block";
  document.getElementById("resultSection").style.display = "none";
  window.scrollTo(0, 0);
});
