import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import "./SearchBox.css";
import { useEffect, useState } from "react";
import { WeatherIcon, DropIcon, WindIcon, ArrowIcon } from "./WeatherIcon";

const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
const POPULAR_CITIES = [
  "Hyderabad",
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "London",
  "New York",
  "Tokyo",
];
const DEFAULT_CITY = "Hyderabad"; // shown automatically when the page opens
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/* ---------- helpers (all times are shown in the searched city's timezone) ---------- */

const shift = (unix, tz) => new Date((unix + tz) * 1000);

const clock = (unix, tz) => {
  const d = shift(unix, tz);
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h >= 12 ? "pm" : "am"}`;
};

const hourLabel = (unix, tz) => {
  const h = shift(unix, tz).getUTCHours();
  return `${h % 12 || 12} ${h >= 12 ? "pm" : "am"}`;
};

const dayKey = (unix, tz) => shift(unix, tz).toISOString().slice(0, 10);

const themeFor = (code) => {
  const type = code.slice(0, 2);
  if (code.endsWith("n") && (type === "01" || type === "02"))
    return "theme-night";
  const map = {
    "01": "theme-clear",
    "02": "theme-clear",
    "03": "theme-clouds",
    "04": "theme-clouds",
    "09": "theme-rain",
    10: "theme-rain",
    11: "theme-storm",
    13: "theme-snow",
    50: "theme-mist",
  };
  return map[type] || "theme-clouds";
};

const humidityLabel = (h) =>
  h < 30 ? "Dry" : h < 60 ? "Comfortable" : h < 80 ? "Humid" : "Very humid";

const buildDaily = (list, tz, nowUnix) => {
  const today = dayKey(nowUnix, tz);
  const groups = {};

  list.forEach((item) => {
    const key = dayKey(item.dt, tz);
    if (key !== today) (groups[key] ||= []).push(item);
  });

  return Object.values(groups)
    .slice(0, 3)
    .map((items) => {
      const noon = items.reduce((best, it) =>
        Math.abs(shift(it.dt, tz).getUTCHours() - 12) <
        Math.abs(shift(best.dt, tz).getUTCHours() - 12)
          ? it
          : best,
      );
      return {
        day: DAYS[shift(items[0].dt, tz).getUTCDay()],
        max: Math.round(Math.max(...items.map((i) => i.main.temp_max))),
        min: Math.round(Math.min(...items.map((i) => i.main.temp_min))),
        code: noon.weather[0].icon.replace("n", "d"),
        description: noon.weather[0].description,
      };
    });
};

/* ---------- small display components ---------- */

function Highlight({ label, icon, value, note }) {
  return (
    <div className="card highlight">
      <p className="muted">{label}</p>
      <div className="highlight-body">
        {icon}
        <div>
          <strong>{value}</strong>
          {note && <span className="note">{note}</span>}
        </div>
      </div>
    </div>
  );
}

function TempChart({ hourly }) {
  const temps = hourly.map((h) => h.temp);
  const min = Math.min(...temps);
  const range = Math.max(...temps) - min || 1;
  const points = hourly.map((h, i) => [
    (i + 0.5) * 100,
    20 + (1 - (h.temp - min) / range) * 70,
  ]);
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  const area = `${line} L${points[points.length - 1][0]} 120 L${points[0][0]} 120 Z`;

  return (
    <>
      <svg
        viewBox="0 0 800 120"
        preserveAspectRatio="none"
        className="chart-svg"
        aria-hidden="true"
      >
        <path d={area} className="chart-area" />
        <path
          d={line}
          className="chart-line"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="chart-cols">
        {hourly.map((h, i) => (
          <div key={i}>
            <strong>{h.temp}°</strong>
            <span>{h.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function RainChart({ hourly }) {
  const peak = Math.max(...hourly.map((h) => h.pop));

  return (
    <div className="card">
      <h3>Chance of rain</h3>
      {hourly.map((h, i) => (
        <div
          key={i}
          className={`rain-row ${h.pop === peak && peak > 0 ? "peak" : ""}`}
        >
          <span className="rain-time">{h.label}</span>
          <div className="track">
            <div className="fill" style={{ width: `${Math.max(h.pop, 3)}%` }} />
          </div>
          <span className="rain-pct">{h.pop}%</span>
        </div>
      ))}
    </div>
  );
}

function Forecast({ daily }) {
  return (
    <div className="card">
      <h3>3 day forecast</h3>
      {daily.map((d) => (
        <div key={d.day} className="forecast-row">
          <div className="fc-day">
            <WeatherIcon code={d.code} size={40} />
            <div>
              <strong>{d.day}</strong>
              <span className="note">{d.description}</span>
            </div>
          </div>
          <div className="pill">
            <ArrowIcon /> {d.max}° <ArrowIcon down /> {d.min}°
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard({ w }) {
  return (
    <div className="dashboard">
      <section className="main-col">
        <p className="muted">Current location</p>
        <h2 className="location">
          {w.name}, {w.country}
        </h2>

        <div className={`hero ${themeFor(w.code)}`}>
          <div className="hero-temp">
            <WeatherIcon code={w.code} size={88} />
            <span className="temp">
              {Math.round(w.temp)}
              <sup>°C</sup>
            </span>
          </div>
          <div className="hero-meta">
            <p className="hero-time">{w.localTime}</p>
            <p className="hero-desc">{w.description}</p>
            <p>Feels like {Math.round(w.feelsLike)}°C</p>
          </div>
        </div>

        <h3>Today's highlights</h3>
        <div className="highlights">
          <Highlight
            label="Precipitation"
            icon={<WeatherIcon code="10d" size={34} />}
            value={`${w.rainNow}%`}
            note="next 3 hours"
          />
          <Highlight
            label="Humidity"
            icon={<DropIcon size={26} />}
            value={`${w.humidity}%`}
            note={humidityLabel(w.humidity)}
          />
          <Highlight
            label="Wind"
            icon={<WindIcon size={26} />}
            value={`${w.wind} km/h`}
          />
          <div className="card highlight">
            <p className="muted">Sunrise &amp; sunset</p>
            <div className="sun-times">
              <span>
                <i className="badge">
                  <ArrowIcon />
                </i>
                <strong>{w.sunrise}</strong>
              </span>
              <span>
                <i className="badge">
                  <ArrowIcon down />
                </i>
                <strong>{w.sunset}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="card chart-card">
          <h3>Temperature, next 24 hours</h3>
          <TempChart hourly={w.hourly} />
        </div>
      </section>

      <aside className="side-col">
        <RainChart hourly={w.hourly} />
        <Forecast daily={w.daily} />
      </aside>
    </div>
  );
}

/* ---------- main component ---------- */

export default function SearchBox() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

  // Returns true on success, false on failure
  const getWeatherInfo = async (cityName) => {
    try {
      setError("");
      setWeather(null);
      setLoading(true);

      if (!API_KEY) {
        throw new Error("API key is missing. Check your .env file.");
      }

      // 1. City -> coordinates
      const geoResponse = await fetch(
        `${GEO_URL}?q=${encodeURIComponent(cityName)}&limit=1&appid=${API_KEY}`,
      );

      if (geoResponse.status === 401) {
        throw new Error("Invalid or inactive API key.");
      }
      if (!geoResponse.ok) {
        throw new Error(`Geocoding API error: ${geoResponse.status}`);
      }

      const geoData = await geoResponse.json();
      if (geoData.length === 0) {
        throw new Error("City not found. Try another city.");
      }

      const { lat, lon, name, country } = geoData[0];

      // 2. Current weather + 5 day / 3 hour forecast
      const query = `lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
      const [weatherRes, forecastRes] = await Promise.all([
        fetch(`${WEATHER_URL}?${query}`),
        fetch(`${FORECAST_URL}?${query}`),
      ]);

      if (!weatherRes.ok)
        throw new Error(`Weather API error: ${weatherRes.status}`);
      if (!forecastRes.ok)
        throw new Error(`Forecast API error: ${forecastRes.status}`);

      const [data, forecast] = await Promise.all([
        weatherRes.json(),
        forecastRes.json(),
      ]);

      // 3. Shape the data for the UI
      const tz = data.timezone;
      const slots = forecast.list.slice(0, 8);

      setWeather({
        name,
        country,
        temp: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        wind: Math.round(data.wind.speed * 3.6), // m/s -> km/h
        description: data.weather[0].description,
        code: data.weather[0].icon,
        sunrise: clock(data.sys.sunrise, tz),
        sunset: clock(data.sys.sunset, tz),
        localTime: `${DAYS[shift(data.dt, tz).getUTCDay()]}, ${clock(data.dt, tz)}`,
        rainNow: Math.round((slots[0]?.pop ?? 0) * 100),
        hourly: slots.map((s) => ({
          label: hourLabel(s.dt, tz),
          temp: Math.round(s.main.temp),
          pop: Math.round(s.pop * 100),
        })),
        daily: buildDaily(forecast.list, tz, data.dt),
      });

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const searchCity = async (name) => {
    const ok = await getWeatherInfo(name);
    if (ok) setCity("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const cityName = city.trim();
    if (cityName) searchCity(cityName);
  };

  // Show a full dashboard straight away instead of an empty page
  useEffect(() => {
    searchCity(DEFAULT_CITY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="weather-app">
      <form className="search-bar" onSubmit={handleSubmit}>
        <TextField
          id="city"
          label="Search city"
          variant="outlined"
          size="small"
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <Button variant="contained" type="submit" disabled={loading}>
          {loading ? "Loading..." : "Search"}
        </Button>
      </form>

      <div className="chips">
        {POPULAR_CITIES.map((name) => (
          <button
            key={name}
            type="button"
            className="chip"
            disabled={loading}
            onClick={() => searchCity(name)}
          >
            {name}
          </button>
        ))}
      </div>

      {loading && !weather && <div className="loading">Loading weather...</div>}

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      {!weather && !loading && (
        <div className="welcome">
          <div className="welcome-icons" aria-hidden="true">
            <span>
              <WeatherIcon code="01d" size={46} />
            </span>
            <span>
              <WeatherIcon code="02d" size={46} />
            </span>
            <span>
              <WeatherIcon code="10d" size={46} />
            </span>
            <span>
              <DropIcon size={34} />
            </span>
            <span>
              <WindIcon size={34} />
            </span>
          </div>
          <h2>What's the weather like?</h2>
          <p>
            Search any city to see the temperature, rain chance, humidity, wind
            and a 3 day forecast.
          </p>
        </div>
      )}

      {weather && <Dashboard w={weather} />}
    </div>
  );
}
