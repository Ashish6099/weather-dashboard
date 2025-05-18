const apiKey = '4919f6b13b1945110319234f4212760a';

document.getElementById('searchBtn').addEventListener('click', () => {
  const city = document.getElementById('cityInput').value;
  if (city) fetchWeatherData(city);
});

let typingTimer;
const debounceDelay = 800;

document.getElementById('cityInput').addEventListener('input', () => {
  clearTimeout(typingTimer);
  const query = document.getElementById('cityInput').value;

  if (query.length > 2) {
    fetchCitySuggestions(query);
    typingTimer = setTimeout(() => {
      fetchWeatherData(query);
    }, debounceDelay);
  }
});

function fetchCitySuggestions(query) {
  const datalist = document.getElementById('cities');

  fetch(`https://api.teleport.org/api/cities/?search=${query}`)
    .then(res => res.json())
    .then(data => {
      datalist.innerHTML = ''; // Clear previous suggestions
      const results = data._embedded['city:search-results'];

      const uniqueCities = new Set();

      results.slice(0, 10).forEach(item => {
        const cityFull = item.matching_full_name;
        const city = cityFull.split(',')[0].trim(); // Just the city name

        if (!uniqueCities.has(city)) {
          uniqueCities.add(city);
          const option = document.createElement('option');
          option.value = city;
          datalist.appendChild(option);
        }
      });

      console.log("Suggestions loaded:", Array.from(uniqueCities));
    })
    .catch(err => console.error('Autocomplete fetch error:', err));
}




function fetchWeatherData(city) {
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

  Promise.all([fetch(currentUrl), fetch(forecastUrl)])
    .then(responses => Promise.all(responses.map(res => res.json())))
    .then(([current, forecast]) => {
      if (current.cod === 200) {
        displayWeatherData(current);
        displayForecastData(forecast);
        updateBackground(current.weather[0].main, current.dt, current.timezone);
        renderWeatherAnimation(current.weather[0].main);
        updateSearchHistory(city);
      } else {
        alert('City not found!');
      }
    });
}

function displayWeatherData(data) {
  const weatherDiv = document.getElementById('weatherInfo');
  weatherDiv.innerHTML = `
    <h2>${data.name}, ${data.sys.country}</h2>
    <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png"
         alt="${data.weather[0].description}" class="weather-icon"/>
    <p><strong>${data.weather[0].description}</strong></p>
    <p><strong>Temp:</strong> ${data.main.temp} °C</p>
    <p><strong>Feels like:</strong> ${data.main.feels_like} °C</p>
    <p><strong>Humidity:</strong> ${data.main.humidity} %</p>
    <p><strong>Wind:</strong> ${data.wind.speed} m/s</p>
  `;
}

function displayForecastData(data) {
  const forecastDiv = document.getElementById('forecast');
  forecastDiv.innerHTML = '';

  const forecastMap = {};
  data.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    if (!forecastMap[date]) forecastMap[date] = [];
    forecastMap[date].push(item);
  });

  Object.keys(forecastMap).slice(0, 5).forEach(date => {
    const dayData = forecastMap[date];
    const temps = dayData.map(d => d.main.temp);
    const icons = dayData.map(d => d.weather[0].icon);
    const min = Math.min(...temps).toFixed(1);
    const max = Math.max(...temps).toFixed(1);
    const icon = icons[Math.floor(icons.length / 2)];

    forecastDiv.innerHTML += `
      <div class="col-md-2 col-sm-4 col-6">
        <div class="card text-center p-2">
          <h6>${new Date(date).toDateString().slice(0, 10)}</h6>
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" class="weather-icon" alt=""/>
          <p><strong>${max}°C</strong> / ${min}°C</p>
        </div>
      </div>
    `;
  });
}

function updateBackground(condition, timestamp, offset) {
  const hours = new Date((timestamp + offset) * 1000).getUTCHours();
  let gradient = '';

  if (condition.includes('Rain')) {
    gradient = 'linear-gradient(to top, #667db6, #0082c8)';
  } else if (condition.includes('Cloud')) {
    gradient = 'linear-gradient(to top, #d7d2cc, #304352)';
  } else if (condition.includes('Clear')) {
    gradient = hours >= 18 || hours < 6
      ? 'linear-gradient(to top, #2c3e50, #4ca1af)'
      : 'linear-gradient(to top, #56ccf2, #2f80ed)';
  } else {
    gradient = 'linear-gradient(to top, #c9d6ff, #e2e2e2)';
  }

  document.body.style.background = gradient;
}

function renderWeatherAnimation(condition) {
  const animContainer = document.getElementById('weather-animation');
  animContainer.innerHTML = '';

  if (condition.includes('Clear')) {
    animContainer.innerHTML = `<div class="sun"></div>`;
  }

  else if (condition.includes('Cloud')) {
    animContainer.innerHTML = `<div class="cloud"></div>`;
  }

  else if (condition.includes('Rain')) {
    let rainHTML = `<div class="cloud"></div>`;
    for (let i = 0; i < 20; i++) {
      let left = Math.random() * 100;
      let delay = Math.random().toFixed(2);
      rainHTML += `<div class="raindrop" style="left:${left}%; animation-delay:${delay}s;"></div>`;
    }
    animContainer.innerHTML = rainHTML;
  }

  else if (condition.includes('Snow')) {
    let snowHTML = `<div class="cloud"></div>`;
    for (let i = 0; i < 20; i++) {
      let left = Math.random() * 100;
      let delay = Math.random().toFixed(2);
      snowHTML += `<div class="snowflake" style="left:${left}%; animation-delay:${delay}s;"></div>`;
    }
    animContainer.innerHTML = snowHTML;
  }

  else {
    animContainer.innerHTML = '';
  }
}


function updateSearchHistory(city) {
  let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
  history = history.filter(item => item !== city);
  history.unshift(city);
  if (history.length > 5) history.pop();
  localStorage.setItem("searchHistory", JSON.stringify(history));
  renderSearchHistory();
}

function renderSearchHistory() {
  const weatherDiv = document.getElementById("weatherInfo");
  const history = JSON.parse(localStorage.getItem("searchHistory")) || [];

  if (!history.length) return;

  const historyHtml = history.map(city =>
    `<button class="btn btn-link p-1 search-history-btn">${city}</button>`
  ).join(" ");

  const container = document.createElement('div');
  container.className = 'mt-3';
  container.innerHTML = `<h5>Recent Searches</h5><div>${historyHtml}</div>`;
  container.id = "recent-searches";

  const old = document.getElementById("recent-searches");
  if (old) old.remove();

  weatherDiv.appendChild(container);

  document.querySelectorAll('.search-history-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const city = btn.textContent;
      document.getElementById('cityInput').value = city;
      fetchWeatherData(city);
    });
  });
}

window.onload = renderSearchHistory;
