
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

export async function getWeather(city) {
  // Step 1: Find the city's coordinates
  const geoResponse = await fetch(
    `${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  );

  if (!geoResponse.ok) {
    throw new Error("Unable to search for this city.");
  }

  const geoData = await geoResponse.json();

  if (!geoData.results || geoData.results.length === 0) {
    throw new Error("City not found. Please try another city.");
  }

  const place = geoData.results[0];

  // Step 2: Fetch weather using latitude and longitude
  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "pressure_msl",
      "wind_speed_10m",
    ].join(","),
    hourly: "temperature_2m,weather_code",
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
    ].join(","),
    timezone: "auto",
    forecast_days: "7",
  });

  const weatherResponse = await fetch(`${WEATHER_URL}?${params}`);

  if (!weatherResponse.ok) {
    throw new Error("Unable to fetch weather information.");
  }

  const weatherData = await weatherResponse.json();

  return {
    place,
    weather: weatherData,
  };
}
export async function getWeatherByCoordinates(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "pressure_msl",
      "wind_speed_10m",
    ].join(","),
    hourly: "temperature_2m,weather_code",
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
    ].join(","),
    timezone: "auto",
    forecast_days: "7",
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`
  );

  if (!response.ok) {
    throw new Error("Unable to fetch local weather.");
  }

  const weather = await response.json();

  return {
    place: {
      name: "My Location",
      latitude,
      longitude,
    },
    weather,
  };
}