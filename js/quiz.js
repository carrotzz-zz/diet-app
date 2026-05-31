// ========== 吾乡帖 · 体质测评 ==========

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
