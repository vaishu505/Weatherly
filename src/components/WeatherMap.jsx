
import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    CircleMarker,
    Popup,
    useMapEvents,
    useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./WeatherMap.css";

function MapClickHandler({ onSelect }) {
    useMapEvents({
        click(event) {
            onSelect([event.latlng.lat, event.latlng.lng]);
        },
    });

    return null;
}

function getCondition(code) {
    if (code === 0) return "Clear sky";
    if ([1, 2].includes(code)) return "Partly cloudy";
    if (code === 3) return "Overcast";
    if ([45, 48].includes(code)) return "Fog";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
    if ([95, 96, 99].includes(code)) return "Thunderstorm";
    return "Unknown conditions";
}

function MapResizeHandler() {
    const map = useMap();

    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200);

        const observer = new ResizeObserver(() => {
            map.invalidateSize();
        });

        observer.observe(map.getContainer());

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [map]);

    return null;
}

function WeatherMap() {
    const [position, setPosition] = useState([17.385, 78.4867]);
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function fetchWeather(latitude, longitude) {
        setLoading(true);
        setError("");
        setWeather(null);

        try {
            const url =
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
                `&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Could not retrieve weather for this location.");
            }

            const data = await response.json();
            setWeather(data.current);
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchWeather(position[0], position[1]);
    }, []);

    function selectLocation(newPosition) {
        setPosition(newPosition);
        fetchWeather(newPosition[0], newPosition[1]);
    }

    return (
        <div className="weather-map-container">
            <div className="weather-map-heading">
                <div>
                    <h2>Explore Weather Around the World</h2>
                    <p>Click anywhere on the map to check the weather there.</p>
                </div>
            </div>
            

            <MapContainer
                center={[17.385, 78.4867]}
                zoom={5}
                scrollWheelZoom={true}
                className="weather-map"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                

                <MapClickHandler onSelect={selectLocation} />

                <CircleMarker
                    center={position}
                    radius={10}
                    pathOptions={{
                        color: "#ffffff",
                        fillColor: "#2563eb",
                        fillOpacity: 1,
                        weight: 3,
                    }}
                >
                    <Popup>
                        <strong>Selected location</strong>
                        <br />
                        Latitude: {position[0].toFixed(3)}
                        <br />
                        Longitude: {position[1].toFixed(3)}
                        {loading && <p>Loading weather...</p>}
                        {weather && (
                            <>
                                <p>{getCondition(weather.weather_code)}</p>
                                <strong>{Math.round(weather.temperature_2m)}°C</strong>
                            </>
                        )}
                    </Popup>
                </CircleMarker>
                
            </MapContainer>
            

            <div className="map-weather-card">
                <h3>Selected Location Weather</h3>
                <p className="map-coordinates">
                    {position[0].toFixed(3)}°, {position[1].toFixed(3)}°
                </p>

                {loading && <p>Fetching weather...</p>}
                {error && <p className="map-error">{error}</p>}

                {weather && !loading && (
                    <div className="map-weather-details">
                        <div>
                            <span>Condition</span>
                            <strong>{getCondition(weather.weather_code)}</strong>
                        </div>
                        <div>
                            <span>Temperature</span>
                            <strong>{Math.round(weather.temperature_2m)}°C</strong>
                        </div>
                        <div>
                            <span>Feels like</span>
                            <strong>{Math.round(weather.apparent_temperature)}°C</strong>
                        </div>
                        <div>
                            <span>Humidity</span>
                            <strong>{weather.relative_humidity_2m}%</strong>
                        </div>
                        <div>
                            <span>Wind speed</span>
                            <strong>{weather.wind_speed_10m} km/h</strong>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default WeatherMap;
