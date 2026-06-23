// ========== 吾乡帖 · 入口 & 工具函数 ==========

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

// ========== 七日温度折线图 ==========
function drawTempChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = { top: 20, right: 16, bottom: 24, left: 32 };
  const pw = W - pad.left - pad.right;
  const ph = H - pad.top - pad.bottom;
  const n = data.days.length;

  // 计算温度范围
  const allTemps = [...data.highs, ...data.lows, data.today];
  let minT = Math.floor(Math.min(...allTemps) / 5) * 5;
  let maxT = Math.ceil(Math.max(...allTemps) / 5) * 5;
  if (maxT - minT < 10) { minT -= 2; maxT += 2; }

  const x = (i) => pad.left + (i / (n - 1)) * pw;
  const y = (t) => pad.top + ph - ((t - minT) / (maxT - minT)) * ph;

  ctx.clearRect(0, 0, W, H);

  // 背景虚线
  ctx.strokeStyle = '#e8e4dc';
  ctx.lineWidth = 1;
  for (let t = minT; t <= maxT; t += 5) {
    const ty = y(t);
    ctx.beginPath(); ctx.moveTo(pad.left, ty); ctx.lineTo(W - pad.right, ty); ctx.stroke();
    ctx.fillStyle = '#999'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(t + '°', pad.left - 4, ty + 4);
  }

  // 低温线
  ctx.strokeStyle = '#5b9bd5'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < n; i++) { const px = x(i), py = y(data.lows[i]); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
  ctx.stroke();

  // 高温线
  ctx.strokeStyle = '#e87a3a'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < n; i++) { const px = x(i), py = y(data.highs[i]); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
  ctx.stroke();

  // 填充区域
  ctx.beginPath();
  for (let i = 0; i < n; i++) ctx.lineTo(x(i), y(data.lows[i]));
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(x(i), y(data.highs[i]));
  ctx.closePath();
  ctx.fillStyle = 'rgba(232,122,58,0.06)';
  ctx.fill();

  // 数据点 + 标签
  const markHigh = n <= 4 ? n : 1; // 少于4天全标，否则只标首尾+最高最低
  const hiIdx = data.highs.indexOf(Math.max(...data.highs));
  const loIdx = data.lows.indexOf(Math.min(...data.lows));
  const markSet = new Set([0, n-1, hiIdx, loIdx]);
  for (let i = 0; i < n; i++) {
    // 高温点
    ctx.beginPath(); ctx.arc(x(i), y(data.highs[i]), 2.5, 0, Math.PI*2); ctx.fillStyle = '#e87a3a'; ctx.fill();
    // 低温点
    ctx.beginPath(); ctx.arc(x(i), y(data.lows[i]), 2.5, 0, Math.PI*2); ctx.fillStyle = '#5b9bd5'; ctx.fill();
    // 日期标签
    ctx.fillStyle = '#888'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(data.days[i], x(i), H - 4);
    // 温标
    if (n <= 7 || markSet.has(i)) {
      ctx.fillStyle = '#e87a3a'; ctx.textAlign = 'center';
      ctx.fillText(data.highs[i].toFixed(0) + '°', x(i), y(data.highs[i]) - 6);
      if (n <= 4) {
        ctx.fillStyle = '#5b9bd5';
        ctx.fillText(data.lows[i].toFixed(0) + '°', x(i), y(data.lows[i]) + 12);
      }
    }
  }

  // 今天标记
  const todayX = x(0), todayY = y(data.today);
  ctx.beginPath(); ctx.arc(todayX, todayY, 5, 0, Math.PI*2);
  ctx.fillStyle = '#fff'; ctx.fill();
  ctx.strokeStyle = '#c03a2b'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(todayX - 3, todayY - 3); ctx.lineTo(todayX + 3, todayY + 3);
  ctx.moveTo(todayX + 3, todayY - 3); ctx.lineTo(todayX - 3, todayY + 3);
  ctx.strokeStyle = '#c03a2b'; ctx.stroke();
  // 今天标签
  ctx.fillStyle = '#c03a2b'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('今天 ' + data.today.toFixed(0) + '°', todayX + 8, todayY + 4);
}

// ========== 随机 ==========
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ========== 本地留存 ==========
const LS_KEY = 'wuxiangtie_data';
const LS_TTL = 7 * 24 * 60 * 60 * 1000; // 7天后自动清除
function saveToLocal() {
  const data = {
    hometownProvince: document.getElementById("hometownProvince").value,
    hometownCity: hometownCitySelect.value,
    currentProvince: document.getElementById("currentProvince").value,
    currentCity: currentCitySelect.value,
    sliders: {},
    prefs: {},
    _ts: Date.now(), // 记录存储时间，用于过期清除
  };
  document.querySelectorAll('input[type="range"]').forEach(s => {
    if (parseInt(s.value) !== 1) data.sliders[s.id] = parseInt(s.value);
  });
  document.querySelectorAll('.pref-options input:checked').forEach(c => {
    if (!data.prefs[c.name]) data.prefs[c.name] = [];
    data.prefs[c.name].push(c.value);
  });
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch(e) {}
}
function restoreFromLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    // 过期检查：超过TTL自动清除
    if (data._ts && (Date.now() - data._ts > LS_TTL)) {
      localStorage.removeItem(LS_KEY);
      return;
    }
    if (data.hometownProvince) {
      document.getElementById("hometownProvince").value = data.hometownProvince;
      populateCitySelect("hometownProvince", "hometownCity");
      setTimeout(() => { if (data.hometownCity) { hometownCitySelect.value = data.hometownCity; onCityChange(); } }, 100);
    }
    if (data.currentProvince) {
      document.getElementById("currentProvince").value = data.currentProvince;
      populateCitySelect("currentProvince", "currentCity");
      setTimeout(() => { if (data.currentCity) { currentCitySelect.value = data.currentCity; onCityChange(); } }, 200);
    }
    if (data.sliders) {
      Object.entries(data.sliders).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) { el.value = val; el.dispatchEvent(new Event('input')); }
      });
    }
    if (data.prefs) {
      Object.entries(data.prefs).forEach(([name, vals]) => {
        vals.forEach(v => {
          const cb = document.querySelector(`input[name="${name}"][value="${v}"]`);
          if (cb) cb.checked = true;
        });
      });
    }
  } catch(e) {}
}
// 保存：城市变动、滑块变动、偏好点击
[hometownCitySelect, currentCitySelect].forEach(s => s.addEventListener("change", saveToLocal));
document.querySelectorAll('input[type="range"]').forEach(s => s.addEventListener("change", saveToLocal));
document.querySelectorAll('.pref-options').forEach(div => div.addEventListener("click", () => setTimeout(saveToLocal, 50)));
// 首次加载恢复
restoreFromLocal();

// ========== 出生信息下拉初始化 ==========
(function initBaziInputs() {
  const yearSel = document.getElementById('birthYear');
  const monthSel = document.getElementById('birthMonth');
  const daySel = document.getElementById('birthDay');
  const hourSel = document.getElementById('birthHour');
  if (!yearSel) return;

  for (let y = 1950; y <= 2015; y++) yearSel.innerHTML += `<option value="${y}">${y}年</option>`;
  for (let m = 1; m <= 12; m++) monthSel.innerHTML += `<option value="${m}">${m}月</option>`;
  for (let d = 1; d <= 31; d++) daySel.innerHTML += `<option value="${d}">${d}日</option>`;

  const shichenLabels = ['子时(23-1点)','丑时(1-3点)','寅时(3-5点)','卯时(5-7点)','辰时(7-9点)','巳时(9-11点)','午时(11-13点)','未时(13-15点)','申时(15-17点)','酉时(17-19点)','戌时(19-21点)','亥时(21-23点)'];
  // 时辰对应的小时值（子时=0, 丑时=2, ... 亥时=22）
  for (let i = 0; i < 12; i++) {
    const h = i === 0 ? 0 : i * 2;
    hourSel.innerHTML += `<option value="${h}">${shichenLabels[i]}</option>`;
  }

  // 恢复 localStorage（带过期检查）
  try {
    const saved = JSON.parse(localStorage.getItem('wuxiangtie_bazi') || '{}');
    // 过期检查：超过7天自动清除出生信息
    if (saved._ts && (Date.now() - saved._ts > 7 * 24 * 60 * 60 * 1000)) {
      localStorage.removeItem('wuxiangtie_bazi');
    } else {
      if (saved.year) yearSel.value = saved.year;
      if (saved.month) monthSel.value = saved.month;
      if (saved.day) daySel.value = saved.day;
      if (saved.hour !== undefined) hourSel.value = saved.hour;
      if (saved.gender) {
        const r = document.querySelector(`input[name="birthGender"][value="${saved.gender}"]`);
        if (r) r.checked = true;
      }
    }
  } catch(e) {}

  // 保存
  const saveBazi = () => {
    const data = {
      year: yearSel.value, month: monthSel.value,
      day: daySel.value, hour: hourSel.value,
      gender: (document.querySelector('input[name="birthGender"]:checked') || {}).value || '',
      _ts: Date.now(), // 记录存储时间，用于过期清除
    };
    try { localStorage.setItem('wuxiangtie_bazi', JSON.stringify(data)); } catch(e) {}
    updateBaziPreview();
  };
  [yearSel, monthSel, daySel, hourSel].forEach(s => s.addEventListener('change', saveBazi));
  document.querySelectorAll('input[name="birthGender"]').forEach(r => r.addEventListener('change', saveBazi));

  function updateBaziPreview() {
    const y = parseInt(yearSel.value), m = parseInt(monthSel.value), d = parseInt(daySel.value), h = parseInt(hourSel.value);
    const g = (document.querySelector('input[name="birthGender"]:checked') || {}).value;
    const preview = document.getElementById('baziPreview');
    if (y && m && d && h !== NaN && g) {
      try {
        const bazi = calcBazi(y, m, d, h, g);
        preview.style.display = 'block';
        const wuxingEmojis = { '木':'🌿','火':'🔥','土':'🌍','金':'⚔️','水':'💧' };
        preview.innerHTML = `
          <div class="bazi-pillars">${bazi.bazi.map(p => `<span class="bazi-pillar">${p.gan}${p.zhi}</span>`).join('')}</div>
          <div class="bazi-info">日主 <strong>${bazi.dayMaster.gan}${bazi.dayMaster.zhi}</strong> · ${bazi.dayMaster.wuxing}${wuxingEmojis[bazi.dayMaster.wuxing]} · ${bazi.bazi.map(p => p.wuxing).join('')}</div>
        `;
      } catch(e) { preview.style.display = 'none'; }
    } else {
      preview.style.display = 'none';
    }
  }
  updateBaziPreview();
})();

// ========== 返回 ==========
document.getElementById("backBtn").addEventListener("click", function() {
  document.getElementById("mainSection").style.display = "block";
  document.getElementById("resultSection").style.display = "none";
  window.scrollTo(0, 0);
});

// ========== 字体大小调节（滑块）==========
const FS_KEY = 'wuxiangtie_fontsize';
const container = document.querySelector('.container');
const fsSlider = document.getElementById('fsSlider');

function setFontSize(scale) {
  container.style.zoom = scale;
  if (fsSlider && parseFloat(fsSlider.value) !== scale) fsSlider.value = scale;
  try { localStorage.setItem(FS_KEY, scale); } catch(e) {}
}

if (fsSlider) {
  fsSlider.addEventListener('input', () => setFontSize(parseFloat(fsSlider.value)));
  // 恢复上次设置
  try {
    const saved = localStorage.getItem(FS_KEY);
    if (saved) setFontSize(parseFloat(saved));
  } catch(e) {}
}
