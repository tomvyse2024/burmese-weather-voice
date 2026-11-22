const weatherContent = document.querySelector('#weather-content');
const statusMessage = document.querySelector('#status');
const searchForm = document.querySelector('#search-form');
const cityInput = document.querySelector('#city-input');
const locationButton = document.querySelector('#location-button');
const speakButton = document.querySelector('#speak-button');
const speakLabel = document.querySelector('#speak-label');
const speakIcon = document.querySelector('#speak-icon');
const voiceNote = document.querySelector('#voice-note');

let currentWeatherSpeech = '';
let speechStarted = false;

const weatherDescriptions = {
  0: ['နေသာ', '☀️'],
  1: ['အများအားဖြင့် နေသာ', '🌤️'],
  2: ['တိမ်အနည်းငယ် ဖြစ်ထွန်း', '⛅'],
  3: ['တိမ်ထူထပ်', '☁️'],
  45: ['မြူထူ', '🌫️'],
  48: ['မြူခဲကျ', '🌫️'],
  51: ['မိုးဖွဲဖွဲရွာ', '🌦️'],
  53: ['မိုးဖွဲရွာ', '🌦️'],
  55: ['မိုးဖွဲသည်းထန်စွာရွာ', '🌧️'],
  56: ['ရေခဲမိုးဖွဲရွာ', '🌧️'],
  57: ['ရေခဲမိုးသည်းထန်စွာရွာ', '🌧️'],
  61: ['မိုးအနည်းငယ်ရွာ', '🌦️'],
  63: ['မိုးအသင့်အတင့်ရွာ', '🌧️'],
  65: ['မိုးသည်းထန်စွာရွာ', '🌧️'],
  66: ['ရေခဲမိုးအနည်းငယ်ရွာ', '🌧️'],
  67: ['ရေခဲမိုးသည်းထန်စွာရွာ', '🌧️'],
  71: ['နှင်းအနည်းငယ်ကျ', '🌨️'],
  73: ['နှင်းကျ', '🌨️'],
  75: ['နှင်းသည်းထန်စွာကျ', '❄️'],
  77: ['နှင်းစက်များကျ', '🌨️'],
  80: ['မိုးကြိုးမုန်တိုင်းမဟုတ်သော မိုးအနည်းငယ်ရွာ', '🌦️'],
  81: ['မိုးရွာ', '🌧️'],
  82: ['မိုးသည်းထန်စွာရွာ', '⛈️'],
  85: ['နှင်းအနည်းငယ်ကျ', '🌨️'],
  86: ['နှင်းသည်းထန်စွာကျ', '❄️'],
  .*: ['မိုးကြိုးမုန်တိုင်းကျ', '⛈️']
};

function describeWeather(code) {
  if (weatherDescriptions[code]) return weatherDescriptions[code];
  if (code >= 95) return weatherDescriptions['.*'];
  return ['ရာသီဥတု အခြေအနေ မသိရသေးပါ', '🌡️'];
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', isError);
}

function getLocationName(latitude, longitude) {
  const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
  url.search = new URLSearchParams({ latitude, longitude, localityLanguage: 'my' });
  return fetch(url).then((response) => {
    if (!response.ok) throw new Error('မြို့အမည်ကို ရယူမရပါ။');
    return response.json();
  }).then((place) => place.city || place.locality || place.principalSubdivision || place.countryName || 'သင့်တည်နေရာ')
    .catch(() => 'သင့်တည်နေရာ');
}

async function getWeather(latitude, longitude, placeName) {
  setStatus('ရာသီဥတုအချက်အလက်ကို ရယူနေပါတယ်…');
  weatherContent.hidden = true;
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude,
    longitude,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    forecast_days: '5',
    timezone: 'auto'
  });

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('မိုးလေဝသဝန်ဆောင်မှုမှ အချက်အလက်မရပါ။');
    const data = await response.json();
    renderWeather(data, placeName);
    weatherContent.hidden = false;
    setStatus('အချက်အလက်ကို အောင်မြင်စွာ ရယူပြီးပါပြီ။');
    speakWeather(true);
  } catch (error) {
    setStatus(`${error.message} အင်တာနက်ချိတ်ဆက်မှုကို စစ်ဆေးပြီး ထပ်မံကြိုးစားပါ။`, true);
  }
}

function renderWeather(data, placeName) {
  const current = data.current;
  const [condition, icon] = describeWeather(current.weather_code);
  const temp = Math.round(current.temperature_2m);
  const feels = Math.round(current.apparent_temperature);
  const humidity = Math.round(current.relative_humidity_2m);
  const wind = Math.round(current.wind_speed_10m);
  const rain = Number(current.precipitation).toFixed(1);

  document.querySelector('#city-name').textContent = placeName;
  document.querySelector('#weather-icon').textContent = icon;
  document.querySelector('#temperature').textContent = `${temp}°`;
  document.querySelector('#condition').textContent = condition;
  document.querySelector('#feels-like').textContent = `ခံစားရသည့်အပူချိန် ${feels}°C`;
  document.querySelector('#humidity').textContent = `${humidity}%`;
  document.querySelector('#wind').textContent = `${wind} km/h`;
  document.querySelector('#precipitation').textContent = `${rain} mm`;

  const date = new Date(`${current.time}:00`);
  document.querySelector('#local-date').textContent = new Intl.DateTimeFormat('my-MM', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: data.timezone
  }).format(date);

  currentWeatherSpeech = `${placeName} မြို့ရဲ့ လက်ရှိရာသီဥတုက ${condition} ဖြစ်ပါတယ်။ အပူချိန် ${temp} ဒီဂရီဆဲလ်စီးယပ်စ်၊ ခံစားရတဲ့အပူချိန် ${feels} ဒီဂရီပါ။ စိုထိုင်းဆ ${humidity} ရာခိုင်နှုန်း၊ လေတိုက်နှုန်း တစ်နာရီကို ${wind} ကီလိုမီတာနဲ့ မိုးရေချိန် ${rain} မီလီမီတာ ရှိပါတယ်။`;
  renderForecast(data.daily, data.timezone);
}

function renderForecast(daily, timezone) {
  const forecastList = document.querySelector('#forecast-list');
  forecastList.replaceChildren();
  daily.time.forEach((day, index) => {
    const [condition, icon] = describeWeather(daily.weather_code[index]);
    const row = document.createElement('div');
    row.className = 'forecast-day';

    const date = new Date(`${day}T12:00:00`);
    const dayName = index === 0 ? 'ဒီနေ့' : new Intl.DateTimeFormat('my-MM', { weekday: 'short', timeZone: timezone }).format(date);
    const name = document.createElement('span');
    name.className = 'forecast-name';
    name.textContent = dayName;
    const emoji = document.createElement('span');
    emoji.className = 'forecast-emoji';
    emoji.setAttribute('aria-hidden', 'true');
    emoji.textContent = icon;
    const conditionText = document.createElement('span');
    conditionText.className = 'forecast-condition';
    conditionText.textContent = condition;
    const temps = document.createElement('span');
    temps.className = 'forecast-temps';
    temps.textContent = `${Math.round(daily.temperature_2m_max[index])}°`;
    const low = document.createElement('span');
    low.textContent = `${Math.round(daily.temperature_2m_min[index])}°`;
    temps.append(low);
    row.append(name, emoji, conditionText, temps);
    forecastList.append(row);
  });
}

function speakWeather(automatic = false) {
  if (!currentWeatherSpeech || !('speechSynthesis' in window)) {
    voiceNote.textContent = 'ဤဘရောက်ဇာတွင် အသံဖတ်စနစ် မရရှိနိုင်ပါ။';
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(currentWeatherSpeech);
  utterance.lang = 'my-MM';
  utterance.rate = 0.88;
  utterance.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const burmeseVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith('my'));
  if (burmeseVoice) utterance.voice = burmeseVoice;
  utterance.onstart = () => {
    speechStarted = true;
    speakIcon.textContent = '⏹️';
    speakLabel.textContent = 'အသံဖတ်ခြင်းကို ရပ်မယ်';
    voiceNote.textContent = 'မြန်မာလို အသံထွက်ဖတ်နေပါတယ်…';
  };
  utterance.onend = () => {
    speechStarted = false;
    speakIcon.textContent = '🔊';
    speakLabel.textContent = 'အသံဖြင့် ပြန်ပြောပါ';
    voiceNote.textContent = 'မကြားရပါက သင့်စက်၏ အသံအတိုးအကျယ်နှင့် မြန်မာအသံစနစ်ကို စစ်ဆေးပါ။';
  };
  utterance.onerror = () => {
    speechStarted = false;
    speakIcon.textContent = '🔊';
    speakLabel.textContent = 'အသံဖြင့် ပြန်ပြောပါ';
    voiceNote.textContent = 'အသံအလိုအလျောက်ဖွင့်ခြင်းကို ဘရောက်ဇာက ပိတ်ထားနိုင်ပါတယ်။ ခလုတ်ကို နှိပ်ပြီး ထပ်စမ်းကြည့်ပါ။';
  };
  if (automatic) voiceNote.textContent = 'အသံဖတ်ရန် ကြိုးစားနေပါတယ်။ ဘရောက်ဇာက အလိုအလျောက်အသံကို ပိတ်ထားပါက ခလုတ်ကို နှိပ်ပါ။';
  window.speechSynthesis.speak(utterance);
}

async function searchCity(city) {
  const query = city.trim();
  if (!query) {
    cityInput.focus();
    setStatus('မြို့အမည်ကို အရင်ရိုက်ထည့်ပါ။', true);
    return;
  }
  setStatus(`${query} ကို ရှာဖွေနေပါတယ်…`);
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search = new URLSearchParams({ name: query, count: '1', language: 'en', format: 'json' });
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Хотыг хайж чадсангүй။');
    const result = await response.json();
    if (!result.results?.length) throw new Error('ဒီမြို့ကို ရှာမတွေ့ပါ။ အင်္ဂလိပ်အမည်နဲ့ ထပ်ရှာကြည့်ပါ။');
    const place = result.results[0];
    const name = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
    await getWeather(place.latitude, place.longitude, name);
  } catch (error) {
    setStatus(error.message, true);
  }
}

function locateUser() {
  if (!navigator.geolocation) {
    setStatus('ဤဘရောက်ဇာတွင် တည်နေရာရှာဖွေမှု မရရှိနိုင်ပါ။ မြို့အမည်ဖြင့် ရှာပါ။', true);
    return;
  }
  setStatus('သင့်တည်နေရာကို ရှာနေပါတယ်… တည်နေရာခွင့်ပြုချက်ကို အတောအတွင်း ပေးပါ။');
  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;
    const placeName = await getLocationName(latitude, longitude);
    await getWeather(latitude, longitude, placeName);
  }, (error) => {
    const message = error.code === error.PERMISSION_DENIED
      ? 'တည်နေရာခွင့်ပြုချက် မရပါ။ အပေါ်ကနေရာခလုတ်ကို နှိပ်ပြီး ခွင့်ပြုပါ၊ သို့မဟုတ် မြို့အမည်နဲ့ ရှာပါ။'
      : 'တည်နေရာကို ရှာမတွေ့ပါ။ မြို့အမည်နဲ့ ရှာကြည့်ပါ။';
    setStatus(message, true);
  }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  searchCity(cityInput.value);
});
locationButton.addEventListener('click', locateUser);
speakButton.addEventListener('click', () => {
  if (speechStarted) {
    window.speechSynthesis.cancel();
    speechStarted = false;
    speakIcon.textContent = '🔊';
    speakLabel.textContent = 'အသံဖြင့် ပြန်ပြောပါ';
    voiceNote.textContent = 'အသံဖတ်ခြင်းကို ရပ်လိုက်ပါပြီ။';
  } else {
    speakWeather(false);
  }
});

locateUser();
