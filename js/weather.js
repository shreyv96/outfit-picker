// Weather from Open-Meteo (free, no API key). Uses Nordic models for Stockholm.
export const STOCKHOLM = { lat: 59.3293, lon: 18.0686, name: 'Stockholm' };
const CACHE_KEY = 'op.weather';

export async function fetchForecast(loc) {
  const params = new URLSearchParams({
    latitude: loc.lat.toFixed(4),
    longitude: loc.lon.toFixed(4),
    hourly: 'temperature_2m,apparent_temperature,precipitation_probability,precipitation,snowfall,wind_speed_10m,wind_gusts_10m,weather_code',
    daily: 'sunrise,sunset',
    wind_speed_unit: 'ms',
    timezone: 'auto',
    forecast_days: '2',
  });
  const key = `${loc.lat.toFixed(2)},${loc.lon.toFixed(2)}`;
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) throw new Error(`Weather service answered ${res.status}`);
    const data = await res.json();
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ key, at: Date.now(), data })); } catch (_) {}
    return { data, offline: false };
  } catch (err) {
    // Offline or the service is down: fall back to the last forecast we saved.
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && cached.key === key) return { data: cached.data, offline: true, at: cached.at };
    } catch (_) {}
    throw err;
  }
}

function localDateString(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Boil the hourly forecast down to what matters while you are out (07:00–21:00).
export function summarizeDay(data, dayOffset = 0) {
  const date = data.daily.time[dayOffset];
  const h = data.hourly;
  const nowHour = new Date().getHours();
  const isToday = date === localDateString();
  let idx = [];
  for (let i = 0; i < h.time.length; i++) {
    if (!h.time[i].startsWith(date)) continue;
    const hour = Number(h.time[i].slice(11, 13));
    if (hour < 7 || hour > 21) continue;
    if (isToday && hour < nowHour && nowHour <= 21) continue;
    idx.push(i);
  }
  if (!idx.length) {
    for (let i = 0; i < h.time.length; i++) {
      const hour = Number(h.time[i].slice(11, 13));
      if (h.time[i].startsWith(date) && hour >= 7 && hour <= 21) idx.push(i);
    }
  }
  const pick = (arr) => idx.map((i) => arr[i] ?? 0);
  const temps = pick(h.temperature_2m);
  const feels = pick(h.apparent_temperature);
  const probs = pick(h.precipitation_probability);
  const precip = pick(h.precipitation);
  const snow = pick(h.snowfall);
  const wind = pick(h.wind_speed_10m);
  const gusts = pick(h.wind_gusts_10m);
  const codes = pick(h.weather_code);
  const sum = (a) => a.reduce((x, y) => x + y, 0);

  const s = {
    date,
    isToday,
    tMin: Math.min(...temps),
    tMax: Math.max(...temps),
    feelsMin: Math.min(...feels),
    feelsMax: Math.max(...feels),
    precipProb: Math.max(...probs),
    precipSum: sum(precip),
    snowSum: sum(snow),
    windMax: Math.max(...wind),
    gustMax: Math.max(...gusts),
    code: Math.max(...codes), // higher WMO codes are more severe
    sunrise: data.daily.sunrise[dayOffset],
    sunset: data.daily.sunset[dayOffset],
  };
  s.wet = s.precipProb >= 50 || s.precipSum >= 1;
  s.snowy = s.snowSum >= 0.5 || (s.wet && s.tMax <= 1);
  s.slushy = s.snowy || (s.wet && s.tMin <= 2);
  s.windy = s.windMax >= 8 || s.gustMax >= 14;
  s.icy = s.tMin <= 0 && s.tMax >= 0 && (s.wet || s.precipSum > 0);
  return s;
}

const CODES = [
  [0, '☀️', 'Clear'], [1, '🌤️', 'Mostly clear'], [2, '⛅', 'Partly cloudy'], [3, '☁️', 'Overcast'],
  [45, '🌫️', 'Fog'], [48, '🌫️', 'Freezing fog'], [51, '🌦️', 'Light drizzle'], [53, '🌦️', 'Drizzle'],
  [55, '🌧️', 'Heavy drizzle'], [56, '🌧️', 'Freezing drizzle'], [57, '🌧️', 'Freezing drizzle'],
  [61, '🌧️', 'Light rain'], [63, '🌧️', 'Rain'], [65, '🌧️', 'Heavy rain'], [66, '🌧️', 'Freezing rain'],
  [67, '🌧️', 'Freezing rain'], [71, '🌨️', 'Light snow'], [73, '🌨️', 'Snow'], [75, '❄️', 'Heavy snow'],
  [77, '🌨️', 'Snow grains'], [80, '🌦️', 'Rain showers'], [81, '🌧️', 'Rain showers'], [82, '⛈️', 'Violent showers'],
  [85, '🌨️', 'Snow showers'], [86, '❄️', 'Heavy snow showers'], [95, '⛈️', 'Thunderstorm'],
  [96, '⛈️', 'Thunderstorm, hail'], [99, '⛈️', 'Thunderstorm, hail'],
];
export function describeCode(code) {
  let best = CODES[0];
  for (const c of CODES) if (c[0] <= code) best = c;
  return { icon: best[1], label: best[2] };
}

export function getDeviceLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Location is not available on this device'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, name: 'Your location' }),
      (e) => reject(e),
      { maximumAge: 30 * 60 * 1000, timeout: 10000 }
    );
  });
}
