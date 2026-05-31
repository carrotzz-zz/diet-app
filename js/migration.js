// ========== 吾乡帖 · 城市选择与水土分析 ==========

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
let currentWeather = null, currentElevation = null, hometownElevation = null, currentAqi = null, hometownAqi = null, currentConflictAnalysis = null;

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

  // 水土差异分析 + 天气显示
  const analysisDiv = document.getElementById("migrationAnalysis");
  if (!cInfo) { analysisDiv.style.display = "none"; return; }

  [currentWeather, currentElevation, hometownElevation, currentAqi, hometownAqi] = await Promise.all([
    fetchWeather(cInfo.lat, cInfo.lon),
    fetchElevation(cInfo.lat, cInfo.lon),
    hInfo ? fetchElevation(hInfo.lat, hInfo.lon) : Promise.resolve(null),
    fetchAirQuality(cInfo.lat, cInfo.lon),
    hInfo ? fetchAirQuality(hInfo.lat, hInfo.lon) : Promise.resolve(null),
  ]);

  // 天气 TCM 诊断
  let weatherBlock = "";
  if (currentWeather) {
    const wCode = currentWeather.weatherCode;
    const wIcon = wCode === 0 ? "☀️" : wCode <= 3 ? "⛅" : wCode <= 48 ? "🌫" : wCode <= 67 ? "🌧" : wCode <= 77 ? "❄️" : "⛈";
    const diag = diagnoseWeather(currentWeather);
    if (diag) {
      const evilTags = diag.evils.map(e => `<span class="evil-tag ${e.name === '平和' ? 'evil-calm' : 'evil-active'}">${e.icon} ${e.name}</span>`).join(' ');
      const impactLines = diag.impacts.map(i => `<div class="evil-impact">• ${i}</div>`).join('');
      weatherBlock = `<div class="ma-weather-tcm">
        <div class="tcm-weather-head">${wIcon} ${currentWeather.temp}°C · 体感${currentWeather.feelsLike}°C · 💧${currentWeather.humidity}% · 🌬${currentWeather.windSpeed}km/h</div>
        <div class="tcm-evil-tags">${evilTags}</div>
        <div class="tcm-impacts">${impactLines}</div>
      </div>`;
    }
  } else {
    weatherBlock = `<div class="ma-weather" style="color:#c03a2b;">⚠️ 天气数据获取失败，请检查网络</div>`;
  }

  // 环境因素两地对比（只突出真正可感知的差异）
  let envFactorsBlock = "";
  if (hInfo && cInfo && hCity !== cCity) {
    try {
      const hElevDiag = diagnoseElevation(hometownElevation);
      const cElevDiag = diagnoseElevation(currentElevation);
      const hWaterDiag = classifyWaterSource(hCity, hInfo, hometownElevation);
      const cWaterDiag = classifyWaterSource(cCity, cInfo, currentElevation);
      const hAqiDiag = diagnoseAirQuality(hometownAqi);
      const cAqiDiag = diagnoseAirQuality(currentAqi);

      // 白话合成（不再罗列四行数据）
      envFactorsBlock = synthesizeEnvironmentDiff(hCity, cCity, hInfo, cInfo,
        hElevDiag, cElevDiag, hWaterDiag, cWaterDiag, hAqiDiag, cAqiDiag,
        hometownElevation, currentElevation, hometownAqi, currentAqi);
    } catch(e) {
      console.error('环境对比渲染失败:', e);
      envFactorsBlock = '';
    }
  } else if (cInfo) {
    // 未选家乡或同城：只展示现居地简要环境
    const cElevDiag = diagnoseElevation(currentElevation);
    const cWaterDiag = classifyWaterSource(cCity, cInfo, currentElevation);
    const aqiDiag = diagnoseAirQuality(currentAqi);

    const parts = [];
    if (cElevDiag && currentElevation != null) parts.push(`${cElevDiag.icon} ${cElevDiag.label} · ${Math.round(currentElevation)}m — ${cElevDiag.tcm}`);
    if (cWaterDiag) parts.push(`${cWaterDiag.icon} 水源${cWaterDiag.type} · ${cWaterDiag.label} — ${cWaterDiag.tcm}`);
    if (aqiDiag) {
      const aqiNote = currentAqi && currentAqi.pm25 != null ? `PM2.5 ${Math.round(currentAqi.pm25)}μg/m³ · ` : '';
      parts.push(`${aqiDiag.icon} 空气 · ${aqiDiag.label} — ${aqiNote}${aqiDiag.tcm}`);
    }
    if (parts.length > 0) {
      envFactorsBlock = `<div class="env-synthesis">
        <div class="env-synthesis-head">🌍 ${cCity} 环境</div>
        <div class="env-synthesis-body">${parts.map(p => `<div class="env-synthesis-item"><div class="esi-text"><span>${p}</span></div></div>`).join('')}</div>
      </div>`;
    }
  }

  if (hInfo && hInfo.region !== cInfo.region) {
    const conflict = getClimateConflict(hInfo.region, cInfo.region);
    if (conflict && conflict.level !== 'low') {
      analysisDiv.style.display = "block";
      analysisDiv.innerHTML = `
        ${weatherBlock}
        ${envFactorsBlock}
        <div class="ma-head">🚨 ${conflict.title}</div>
        <p class="ma-body">${conflict.body}</p>
        <div class="ma-tips">${conflict.tips.map(t => `<span class="ma-tip">${t}</span>`).join('')}</div>`;
    } else {
      analysisDiv.style.display = "block";
      analysisDiv.innerHTML = weatherBlock + envFactorsBlock;
    }
  } else if (hInfo && hInfo.region === cInfo.region) {
    analysisDiv.style.display = "block";
    analysisDiv.innerHTML = `${weatherBlock}${envFactorsBlock}<div class="ma-ok">✅ 家乡和现居地气候相近，水土适应的压力不大。</div>`;
  } else {
    analysisDiv.style.display = "block";
    analysisDiv.innerHTML = weatherBlock + envFactorsBlock;
  }
}

hometownCitySelect.addEventListener("change", onCityChange);
currentCitySelect.addEventListener("change", onCityChange);
