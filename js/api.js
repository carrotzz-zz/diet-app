// ========== API 请求层 ==========

// 天气缓存
const weatherCache = {};
async function fetchWeather(lat, lon) {
  const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
  if (weatherCache[key] && (Date.now() - weatherCache[key].ts) < 30*60*1000) return weatherCache[key].data;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FShanghai&forecast_days=7`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error("API err");
    const j = await r.json();
    const d = { temp: j.current.temperature_2m, feelsLike: j.current.apparent_temperature, humidity: j.current.relative_humidity_2m, windSpeed: j.current.wind_speed_10m, weatherCode: j.current.weather_code, daily: j.daily };
    weatherCache[key] = { data: d, ts: Date.now() };
    return d;
  } catch(e) { console.warn("天气API:", e.message); return null; }
}

// 海拔缓存
const elevationCache = {};
async function fetchElevation(lat, lon) {
  const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
  if (elevationCache[key] && (Date.now() - elevationCache[key].ts) < 30*60*1000) return elevationCache[key].data;
  try {
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error("Elevation API err");
    const j = await r.json();
    const data = j.elevation && j.elevation[0] != null ? j.elevation[0] : null;
    elevationCache[key] = { data, ts: Date.now() };
    return data;
  } catch(e) { console.warn("海拔API:", e.message); return null; }
}

// 空气质量缓存
const aqiCache = {};
async function fetchAirQuality(lat, lon) {
  const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
  if (aqiCache[key] && (Date.now() - aqiCache[key].ts) < 30*60*1000) return aqiCache[key].data;
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm2_5,pm10`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error("AQI API err");
    const j = await r.json();
    const data = j.current ? { aqi: j.current.european_aqi, pm25: j.current.pm2_5, pm10: j.current.pm10 } : null;
    aqiCache[key] = { data, ts: Date.now() };
    return data;
  } catch(e) { console.warn("空气质量API:", e.message); return null; }
}
