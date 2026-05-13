'use client';
import { useEffect, useState } from 'react';

export type WeatherIcon =
  | 'sun' | 'moon' | 'cloud-sun' | 'cloud-moon'
  | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

export interface WeatherInfo {
  icon: WeatherIcon;
  label: string;
  temp: number;
  unit: string;
}

// WMO weather interpretation codes → icon + label
// https://open-meteo.com/en/docs#weathervariables
const WMO: Record<number, { day: WeatherIcon; night: WeatherIcon; label: string }> = {
  0:  { day: 'sun',       night: 'moon',        label: 'Clear sky' },
  1:  { day: 'sun',       night: 'moon',        label: 'Mainly clear' },
  2:  { day: 'cloud-sun', night: 'cloud-moon',  label: 'Partly cloudy' },
  3:  { day: 'cloud',     night: 'cloud',       label: 'Overcast' },
  45: { day: 'fog',       night: 'fog',         label: 'Foggy' },
  48: { day: 'fog',       night: 'fog',         label: 'Icy fog' },
  51: { day: 'drizzle',   night: 'drizzle',     label: 'Light drizzle' },
  53: { day: 'drizzle',   night: 'drizzle',     label: 'Drizzle' },
  55: { day: 'drizzle',   night: 'drizzle',     label: 'Heavy drizzle' },
  61: { day: 'rain',      night: 'rain',        label: 'Light rain' },
  63: { day: 'rain',      night: 'rain',        label: 'Rain' },
  65: { day: 'rain',      night: 'rain',        label: 'Heavy rain' },
  71: { day: 'snow',      night: 'snow',        label: 'Light snow' },
  73: { day: 'snow',      night: 'snow',        label: 'Snow' },
  75: { day: 'snow',      night: 'snow',        label: 'Heavy snow' },
  80: { day: 'rain',      night: 'rain',        label: 'Showers' },
  81: { day: 'rain',      night: 'rain',        label: 'Showers' },
  82: { day: 'rain',      night: 'rain',        label: 'Heavy showers' },
  95: { day: 'storm',     night: 'storm',       label: 'Thunderstorm' },
  96: { day: 'storm',     night: 'storm',       label: 'Thunderstorm' },
  99: { day: 'storm',     night: 'storm',       label: 'Severe storm' },
};

function isNight(): boolean {
  const h = new Date().getHours();
  return h >= 20 || h < 6;
}

export function useWeather(): WeatherInfo | null {
  const [info, setInfo] = useState<WeatherInfo | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}` +
            `&current=weathercode,temperature_2m&temperature_unit=celsius`,
            { next: { revalidate: 0 } } as RequestInit,
          );
          const data = await res.json();
          const code: number = data?.current?.weathercode ?? 0;
          const temp: number = Math.round(data?.current?.temperature_2m ?? 20);
          const entry = WMO[code] ?? WMO[0];
          const night = isNight();
          setInfo({ icon: night ? entry.night : entry.day, label: entry.label, temp, unit: '°C' });
        } catch {
          // silently fail — weather is decorative
        }
      },
      () => {
        // Permission denied — use a default neutral icon
        const night = isNight();
        setInfo({ icon: night ? 'moon' : 'sun', label: '', temp: 0, unit: '°C' });
      },
      { timeout: 5000 },
    );
  }, []);

  return info;
}
