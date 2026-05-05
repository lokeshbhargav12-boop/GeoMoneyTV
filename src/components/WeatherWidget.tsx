"use client";

import { useState, useEffect } from "react";
import { Cloud, Droplets, Wind, Thermometer, AlertTriangle, RefreshCw } from "lucide-react";

interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  description: string;
  location: string;
}

export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Default locations to cycle through for global climate monitoring
  const locations = [
    { name: "Strait of Hormuz", lat: 26.56, lon: 56.25 },
    { name: "Suez Canal", lat: 30.6, lon: 32.34 },
    { name: "Panama Canal", lat: 9.08, lon: -79.68 },
    { name: "Malacca Strait", lat: 1.43, lon: 102.89 },
  ];
  
  const [locIndex, setLocIndex] = useState(0);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const loc = locations[locIndex];
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      
      if (!apiKey) {
        // Fallback demo data if no key is provided
        setTimeout(() => {
          setData({
            temp: 25 + Math.random() * 10,
            humidity: 60 + Math.random() * 20,
            windSpeed: 5 + Math.random() * 15,
            description: "scattered clouds",
            location: loc.name,
          });
          setLoading(false);
        }, 800);
        return;
      }

      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lon}&appid=${apiKey}&units=metric`);
      if (!res.ok) throw new Error("Weather API failed");
      
      const json = await res.json();
      setData({
        temp: json.main.temp,
        humidity: json.main.humidity,
        windSpeed: json.wind.speed,
        description: json.weather[0].description,
        location: loc.name,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locIndex]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <select 
          value={locIndex} 
          onChange={(e) => setLocIndex(Number(e.target.value))}
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500/50"
        >
          {locations.map((l, i) => (
            <option key={l.name} value={i} className="bg-black text-white">{l.name}</option>
          ))}
        </select>
        <button 
          onClick={fetchWeather}
          className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          disabled={loading}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Display */}
      {loading && !data ? (
        <div className="h-32 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="h-32 flex flex-col items-center justify-center text-red-400 bg-red-500/5 rounded-xl border border-red-500/20">
          <AlertTriangle className="w-5 h-5 mb-2" />
          <span className="text-[10px] font-mono">{error}</span>
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-white flex items-start">
                {Math.round(data.temp)}<span className="text-sm text-cyan-400 mt-1">°C</span>
              </div>
              <div className="text-xs text-gray-400 capitalize mt-1 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5" />
                {data.description}
              </div>
            </div>
            {!process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY && (
              <div className="text-[9px] font-mono text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                DEMO MODE
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center">
            <Wind className="w-4 h-4 text-gray-400 mb-1" />
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Wind</div>
            <div className="text-sm font-bold text-white">{data.windSpeed.toFixed(1)} <span className="text-[9px] text-gray-400">m/s</span></div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center">
            <Droplets className="w-4 h-4 text-gray-400 mb-1" />
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Humidity</div>
            <div className="text-sm font-bold text-white">{Math.round(data.humidity)}%</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
