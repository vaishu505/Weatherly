
import { useEffect, useState } from "react";

import {
    Search,
    MapPin,
    Sun,
    Moon,
    Wind,
    Droplets,
    Thermometer,
    CloudSun,
    Cloud,
    CloudRain,
    CloudSnow,
    CloudLightning,
    Gauge,
    Sunrise,
    Sunset,
    LoaderCircle,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import WeatherMap from "../components/WeatherMap";

import {
    getWeather,
    getWeatherByCoordinates,
} from "../services/weatherApi";


function getWeatherInfo(code) {
    if (code === 0) return { text: "Clear Sky", icon: Sun };
    if (code === 1 || code === 2) return { text: "Partly Cloudy", icon: CloudSun };
    if (code === 3) return { text: "Overcast", icon: Cloud };
    if ([45, 48].includes(code)) return { text: "Foggy", icon: Cloud };
    if ([51, 53, 55, 56, 57].includes(code)) return { text: "Drizzle", icon: CloudRain };
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { text: "Rainy", icon: CloudRain };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { text: "Snowy", icon: CloudSnow };
    if ([95, 96, 99].includes(code)) return { text: "Thunderstorm", icon: CloudLightning };

    return { text: "Unknown", icon: CloudSun };
}


function getWeatherBackground(code) {
    if (code === 0) return "sunny";
    if ([1, 2].includes(code)) return "partly-cloudy";
    if ([3, 45, 48].includes(code)) return "cloudy";

    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return "rainy";
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return "snowy";
    }

    if ([95, 96, 99].includes(code)) return "stormy";

    return "sunny";
}


function Dashboard() {

    // Theme
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("weatherly-theme") === "dark";
    });

    const [unit, setUnit] = useState("C");
    const [selectedDay, setSelectedDay] = useState(null);

    // Favorite cities
    const [favorites, setFavorites] = useState(() => {
        try {
            return JSON.parse(
                localStorage.getItem("weatherFavorites") || "[]"
            );
        } catch {
            return [];
        }
    });

    // City and weather data
    const [cityInput, setCityInput] = useState("Hyderabad");
    const [city, setCity] = useState("Hyderabad");
    const [place, setPlace] = useState(null);
    const [weather, setWeather] = useState(null);

    // Loading and errors
    const [loading, setLoading] = useState(true);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState("");
    const [error, setError] = useState("");


    // Get user's current location
    async function useMyLocation() {

        if (!navigator.geolocation) {
            setLocationError(
                "Geolocation is not supported by your browser."
            );
            return;
        }

        setLocationLoading(true);
        setLocationError("");

        navigator.geolocation.getCurrentPosition(

            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;

                    const result = await getWeatherByCoordinates(
                        latitude,
                        longitude
                    );

                    setPlace(result.place);
                    setWeather(result.weather);
                    setError("");

                } catch (err) {
                    setLocationError(
                        err.message || "Unable to get weather for your location."
                    );
                } finally {
                    setLocationLoading(false);
                }
            },

            (err) => {
                setLocationLoading(false);

                if (err.code === 1) {
                    setLocationError(
                        "Please allow location access in your browser."
                    );
                } else {
                    setLocationError(
                        "Unable to detect your location. Please try again."
                    );
                }
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000,
            }
        );
    }


    // Save current city to favorites
    function saveFavorite() {

        if (!place) return;

        const cityName = place.name;

        const updatedFavorites = favorites.includes(cityName)
            ? favorites
            : [...favorites, cityName];

        setFavorites(updatedFavorites);

        localStorage.setItem(
            "weatherFavorites",
            JSON.stringify(updatedFavorites)
        );
    }


    // Remove favorite city
    function removeFavorite(cityName) {

        const updatedFavorites = favorites.filter(
            (city) => city !== cityName
        );

        setFavorites(updatedFavorites);

        localStorage.setItem(
            "weatherFavorites",
            JSON.stringify(updatedFavorites)
        );
    }


    // Search a favorite city
    function selectFavorite(cityName) {
        setCityInput(cityName);
        setCity(cityName);
    }


    // Save theme preference
    useEffect(() => {

        localStorage.setItem(
            "weatherly-theme",
            darkMode ? "dark" : "light"
        );

    }, [darkMode]);


    // Fetch weather whenever city changes
    useEffect(() => {

        let cancelled = false;

        async function fetchWeather() {

            setLoading(true);
            setError("");
            setSelectedDay(null);

            try {

                const result = await getWeather(city);

                if (!cancelled) {
                    setPlace(result.place);
                    setWeather(result.weather);
                }

            } catch (err) {

                if (!cancelled) {
                    setError(
                        err.message || "Something went wrong."
                    );
                    setWeather(null);
                }

            } finally {

                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchWeather();

        return () => {
            cancelled = true;
        };

    }, [city]);


    // Handle city search
    function handleSearch(e) {

        e.preventDefault();

        const trimmedCity = cityInput.trim();

        if (!trimmedCity) {
            setError("Please enter a city name.");
            return;
        }

        setCity(trimmedCity);
    }


    // Weather data
    const current = weather?.current;
    const hourly = weather?.hourly;
    const daily = weather?.daily;

    const currentInfo = current
        ? getWeatherInfo(current.weather_code)
        : null;

    const CurrentIcon = currentInfo?.icon || CloudSun;


    // Next 6 hours
    const nextHours = hourly
        ? hourly.time
            .map((time, index) => ({
                time,
                temperature: hourly.temperature_2m[index],
                code: hourly.weather_code[index],
            }))
            .filter((item) => new Date(item.time) >= new Date())
            .slice(0, 6)
        : [];


    // Next 7 days
    const nextDays = daily
        ? daily.time.map((date, index) => ({
            date,
            code: daily.weather_code[index],
            max: daily.temperature_2m_max[index],
            min: daily.temperature_2m_min[index],
            sunrise: daily.sunrise?.[index],
            sunset: daily.sunset?.[index],
        }))
        : [];


    // Format forecast time
    function formatHour(time) {
        return new Date(time).toLocaleTimeString([], {
            hour: "numeric",
        });
    }


    // Format forecast day
    function formatDay(date) {
        return new Date(date + "T12:00:00").toLocaleDateString(
            "en-US",
            { weekday: "short" }
        );
    }


    // Format temperature
    function formatTemp(temp) {
        if (unit === "F") {
            return Math.round((temp * 9) / 5 + 32);
        }

        return Math.round(temp);
    }


    return (

        <div className={`dashboard ${darkMode ? "dark" : ""}`}>

            <Sidebar />

            <main className="main-content" id="dashboard">

                {/* Header */}
                <header className="header">

                    <div>
                        <h2>Weather Dashboard</h2>

                        <p className="header-subtitle">
                            Your daily weather overview
                        </p>
                    </div>

                    <div className="header-actions">

                        <div className="location">
                            <MapPin size={18} />

                            <span>
                                {place?.country || "Searching..."}
                            </span>
                        </div>

                        <div className="unit-toggle">

                            <button
                                className={unit === "C" ? "active" : ""}
                                onClick={() => setUnit("C")}
                            >
                                °C
                            </button>

                            <button
                                className={unit === "F" ? "active" : ""}
                                onClick={() => setUnit("F")}
                            >
                                °F
                            </button>

                        </div>

                        <button
                            className="theme-btn"
                            onClick={() => setDarkMode((previous) => !previous)}
                            aria-label="Toggle theme"
                        >
                            {darkMode ? <Sun /> : <Moon />}
                        </button>

                    </div>

                </header>


                {/* Search Section */}
                <section className="search-section">

                    <h1>Discover the Weather</h1>

                    <p>
                        Explore real-time weather around the world.
                    </p>

                    <div className="search-actions">

                        <form
                            className="search-box"
                            onSubmit={handleSearch}
                        >

                            <Search size={20} />

                            <input
                                type="text"
                                placeholder="Search for a city..."
                                value={cityInput}
                                onChange={(e) => setCityInput(e.target.value)}
                            />

                            <button
                                type="submit"
                                disabled={loading}
                            >
                                Search
                            </button>

                        </form>


                        <button
                            type="button"
                            className="location-button"
                            onClick={useMyLocation}
                            disabled={locationLoading}
                        >

                            <MapPin size={18} />

                            {locationLoading
                                ? "Finding..."
                                : "Use My Location"}

                        </button>

                    </div>


                    {locationError && (
                        <p className="error-message">
                            {locationError}
                        </p>
                    )}

                </section>


                {/* Loading */}
                {loading && (

                    <div className="status-message">

                        <LoaderCircle className="loading-icon" />

                        <p>Getting the latest weather...</p>

                    </div>

                )}


                {/* Error */}
                {!loading && error && (

                    <div className="error-message">
                        {error}
                    </div>

                )}


                {/* Current Weather */}
                {!loading && weather && current && (

                    <section
                        className={`weather-card ${getWeatherBackground(current.weather_code)}`}
                    >

                        <div>

                            <p className="weather-label">
                                CURRENT WEATHER
                            </p>

                            <h2>
                                {place?.name || "My Location"}
                                {place?.country ? `, ${place.country}` : ""}
                            </h2>

                            <h1 className="temperature">
                                {formatTemp(current.temperature_2m)}°
                            </h1>

                            <h3>
                                {currentInfo.text}
                            </h3>

                            <p>
                                Feels like{" "}
                                {formatTemp(current.apparent_temperature)}°
                            </p>

                        </div>

                        <div className="weather-icon">
                            <CurrentIcon size={110} />
                        </div>

                    </section>

                )}


                {/* Favorite Cities */}
                <section className="favorites-section" id="favorites">

                    <div className="section-heading">

                        <h3>Favorite Cities</h3>

                        {place && (
                            <button
                                onClick={saveFavorite}
                                className="favorite-button"
                                disabled={favorites.includes(place.name)}
                            >
                                {favorites.includes(place.name)
                                    ? "Saved"
                                    : `+ Save ${place.name}`}
                            </button>
                        )}

                    </div>


                    <div className="favorite-list">

                        {favorites.length === 0 ? (

                            <p>
                                No favorites yet. Save a city to see it here.
                            </p>

                        ) : (

                            favorites.map((cityName) => (

                                <div
                                    className="favorite-city"
                                    key={cityName}
                                >

                                    <button
                                        onClick={() => selectFavorite(cityName)}
                                    >
                                        {cityName}
                                    </button>

                                    <button
                                        onClick={() => removeFavorite(cityName)}
                                        aria-label={`Remove ${cityName}`}
                                    >
                                        ×
                                    </button>

                                </div>

                            ))

                        )}

                    </div>

                </section>

                {/* Settings Section */}
{/* <section id="settings" className="settings-section">
    <h2 className="section-title">Settings</h2>
    <p>Customize your Weatherly experience.</p>
</section> */}


                {/* Interactive Weather Map */}
                <section
                    id="weather-map"
                    className="weather-map-section"
                >
                    <WeatherMap />
                </section>


                {/* Remaining Weather Details */}
                {!loading && weather && current && (

                    <>

                        {/* Today's Highlights */}
                        <h2 className="section-title">
                            Today's Highlights
                        </h2>

                        <section className="details-grid">

                            <div className="detail-card">
                                <Droplets />
                                <p>Humidity</p>
                                <h2>
                                    {current.relative_humidity_2m}%
                                </h2>
                            </div>

                            <div className="detail-card">
                                <Wind />
                                <p>Wind Speed</p>
                                <h2>
                                    {current.wind_speed_10m} km/h
                                </h2>
                            </div>

                            <div className="detail-card">
                                <Gauge />
                                <p>Pressure</p>
                                <h2>
                                    {Math.round(current.pressure_msl)} hPa
                                </h2>
                            </div>

                            <div className="detail-card">
                                <Thermometer />
                                <p>Precipitation</p>
                                <h2>
                                    {current.precipitation} mm
                                </h2>
                            </div>

                        </section>


                        {/* Hourly Forecast */}
                        <h2 className="section-title">
                            Hourly Forecast
                        </h2>

                        <section className="forecast">

                            {nextHours.map((item) => {

                                const Info = getWeatherInfo(item.code);
                                const Icon = Info.icon;

                                return (

                                    <div
                                        className="forecast-card"
                                        key={item.time}
                                    >

                                        <p>{formatHour(item.time)}</p>

                                        <Icon size={35} />

                                        <h3>
                                            {formatTemp(item.temperature)}°
                                        </h3>

                                        <span>{Info.text}</span>

                                    </div>

                                );
                            })}

                        </section>


                        {/* 7-Day Forecast */}
                        <h2 className="section-title">
                            7-Day Forecast
                        </h2>

                        <section className="forecast">

                            {nextDays.map((item) => {

                                const Info = getWeatherInfo(item.code);
                                const Icon = Info.icon;

                                return (

                                    <div
                                        className={`forecast-card ${
                                            selectedDay?.date === item.date ? "selected" : ""
                                        }`}
                                        key={item.date}
                                        onClick={() => setSelectedDay(item)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                setSelectedDay(item);
                                            }
                                        }}
                                    >

                                        <p>{formatDay(item.date)}</p>

                                        <Icon size={35} />

                                        <h3>
                                            {formatTemp(item.max)}° / {formatTemp(item.min)}°
                                        </h3>

                                        <span>{Info.text}</span>

                                    </div>

                                );
                            })}

                        </section>


                        {/* Selected Day Details */}
                        {selectedDay && (

                            <section className="selected-day-details">

                                <h2>
                                    Weather Details -{" "}
                                    {new Date(selectedDay.date + "T12:00:00").toLocaleDateString(
                                        "en-US",
                                        {
                                            weekday: "long",
                                            month: "long",
                                            day: "numeric",
                                        }
                                    )}
                                </h2>

                                <div className="selected-day-content">

                                    <div>
                                        {(() => {
                                            const Info = getWeatherInfo(selectedDay.code);
                                            const Icon = Info.icon;

                                            return (
                                                <>
                                                    <Icon size={55} />
                                                    <h3>{Info.text}</h3>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    <div>
                                        <p>Maximum Temperature</p>
                                        <h2>{formatTemp(selectedDay.max)}°</h2>
                                    </div>

                                    <div>
                                        <p>Minimum Temperature</p>
                                        <h2>{formatTemp(selectedDay.min)}°</h2>
                                    </div>

                                    <div>
                                        <Sunrise />
                                        <p>Sunrise</p>
                                        <h3>
                                            {selectedDay.sunrise
                                                ? new Date(selectedDay.sunrise).toLocaleTimeString([], {
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                })
                                                : "Unavailable"}
                                        </h3>
                                    </div>

                                    <div>
                                        <Sunset />
                                        <p>Sunset</p>
                                        <h3>
                                            {selectedDay.sunset
                                                ? new Date(selectedDay.sunset).toLocaleTimeString([], {
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                })
                                                : "Unavailable"}
                                        </h3>
                                    </div>

                                </div>

                            </section>

                        )}


                        {/* Sunrise and Sunset */}
                        {daily?.sunrise?.[0] && daily?.sunset?.[0] && (

                            <section className="sun-times">

                                <div>
                                    <Sunrise />

                                    <span>Sunrise</span>

                                    <strong>
                                        {new Date(daily.sunrise[0]).toLocaleTimeString([], {
                                            hour: "numeric",
                                            minute: "2-digit",
                                        })}
                                    </strong>
                                </div>


                                <div>
                                    <Sunset />

                                    <span>Sunset</span>

                                    <strong>
                                        {new Date(daily.sunset[0]).toLocaleTimeString([], {
                                            hour: "numeric",
                                            minute: "2-digit",
                                        })}
                                    </strong>
                                </div>

                            </section>

                        )}

                    </>

                )}
                {/* Settings Section */}
<section id="settings" className="settings-section">

    <h2 className="section-title">Settings</h2>

    <div className="settings-card">

        <div className="setting-item">
    <div>
        <h3>Appearance</h3>
        <p>Choose your preferred theme.</p>
    </div>

    <div className="theme-options">
        <button
            className={!darkMode ? "active" : ""}
            onClick={() => setDarkMode(false)}
        >
            <Sun size={16} />
            Light Mode
        </button>

        <button
            className={darkMode ? "active" : ""}
            onClick={() => setDarkMode(true)}
        >
            <Moon size={16} />
            Dark Mode
        </button>
    </div>
</div>

        <div className="setting-item">
            <div>
                <h3>Temperature Unit</h3>
                <p>Choose your preferred temperature unit.</p>
            </div>

            <div className="unit-toggle">
                <button
                    className={unit === "C" ? "active" : ""}
                    onClick={() => setUnit("C")}
                >
                    °C
                </button>

                <button
                    className={unit === "F" ? "active" : ""}
                    onClick={() => setUnit("F")}
                >
                    °F
                </button>
            </div>
        </div>

        <div className="setting-item">
            <div>
                <h3>Current City</h3>
                <p>{place?.name || city}</p>
            </div>
        </div>

    </div>

</section>

            </main>

        </div>

    );
}

export default Dashboard;
