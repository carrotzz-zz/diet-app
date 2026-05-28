// ========== 季节判定 ==========
const seasonMonths = {
  "春": [2,3,4],
  "夏": [5,6,7],
  "长夏": [8],
  "秋": [9,10,11],
  "冬": [12,1]
};

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  for (let [season, months] of Object.entries(seasonMonths)) {
    if (months.includes(month)) return season;
  }
  return "春";
}

const currentSeason = getCurrentSeason();
document.getElementById("seasonHint").textContent = `📅 当前季节：${currentSeason}季 · 为您推荐应季药膳`;

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

// 滑块数值实时显示
document.querySelectorAll('input[type="range"]').forEach(slider => {
  slider.addEventListener("input", function() {
    const valSpan = document.getElementById("val_" + this.id.replace("q_",""));
    if (valSpan) valSpan.textContent = this.value;
  });
});

// ========== 城市下拉框 ==========
const citySelect = document.getElementById("citySelect");
const sortedCities = Object.keys(cityRegionMap).sort();
sortedCities.forEach(city => {
  const option = document.createElement("option");
  option.value = city;
  option.textContent = city;
  citySelect.appendChild(option);
});

citySelect.addEventListener("change", function() {
  const region = cityRegionMap[this.value];
  document.getElementById("regionResult").textContent = region ? `🌍 气候区：${region}` : "";
});

// ========== 体质判定 ==========
function determineConstitution() {
  const scores = {};
  questions.forEach(q => {
    const slider = document.getElementById("q_" + q.key);
    scores[q.key] = parseInt(slider.value);
  });

  // 最高分
  let primary = "平和质";
  let maxScore = 0;
  for (let [key, val] of Object.entries(scores)) {
    if (val > maxScore) {
      maxScore = val;
      primary = key;
    }
  }
  if (maxScore <= 2) primary = "平和质";

  // 次高分（≥3 分且非主体质）
  let secondary = null;
  let secondScore = 0;
  for (let [key, val] of Object.entries(scores)) {
    if (key !== primary && val >= 3 && val > secondScore) {
      secondScore = val;
      secondary = key;
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

// ========== 推荐逻辑 ==========
document.getElementById("submitBtn").addEventListener("click", function() {
  const constitution = determineConstitution();
  const city = citySelect.value;
  const region = cityRegionMap[city] || "";

  if (!region) {
    alert("请选择您的常驻城市");
    return;
  }

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

  // 放宽：不过滤 avoid，仅季节+区域+不回避
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

  const results = candidates.slice(0, 3);

  // 切换视图
  document.getElementById("quizSection").style.display = "none";
  document.getElementById("resultSection").style.display = "block";

  let constText = `主要体质：${constitution.primary}`;
  if (constitution.secondary) constText += `，兼夹倾向：${constitution.secondary}`;
  document.getElementById("constitutionResult").textContent = constText;
  document.getElementById("regionDisplay").textContent = `常驻气候区：${region}`;
  document.getElementById("seasonDisplay").textContent = `当前季节：${currentSeason}`;

  const cardsDiv = document.getElementById("dietCards");
  cardsDiv.innerHTML = "";

  if (results.length === 0) {
    cardsDiv.innerHTML = "<p>😔 暂无完全匹配的药膳，请调整偏好或等待知识库更新。</p>";
  } else {
    results.forEach(d => {
      const card = document.createElement("div");
      card.className = "diet-card";
      card.innerHTML = `
        <h3>🍲 ${d.name}</h3>
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
