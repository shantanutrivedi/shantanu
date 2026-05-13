'use client';
import type { WeatherIcon } from '@/lib/useWeather';

const SIZE = 28;

export default function WeatherIcon({ icon, size = SIZE }: { icon: WeatherIcon; size?: number }) {
  const s = size;
  const c = s / 2;

  switch (icon) {
    case 'sun':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden>
          <circle cx="14" cy="14" r="5.5" fill="#FFCB5C" />
          {[0,45,90,135,180,225,270,315].map(deg => {
            const r = Math.PI * deg / 180;
            const x1 = 14 + 8 * Math.cos(r), y1 = 14 + 8 * Math.sin(r);
            const x2 = 14 + 11 * Math.cos(r), y2 = 14 + 11 * Math.sin(r);
            return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFCB5C" strokeWidth="1.8" strokeLinecap="round" />;
          })}
        </svg>
      );
    case 'moon':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden>
          <path d="M18 8.5C14.5 9 12 12 12 16c0 3.5 2.5 6.5 6 7C13.5 24 9 20.5 9 15.5c0-5 4.5-8.5 9-7z" fill="#B7B3DC" />
        </svg>
      );
    case 'cloud-sun':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden>
          <circle cx="19" cy="10" r="4" fill="#FFCB5C" opacity="0.9" />
          {[0,60,120,180,240,300].map(deg => {
            const r = Math.PI * deg / 180;
            const x1 = 19 + 5.5 * Math.cos(r), y1 = 10 + 5.5 * Math.sin(r);
            const x2 = 19 + 7.5 * Math.cos(r), y2 = 10 + 7.5 * Math.sin(r);
            return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFCB5C" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />;
          })}
          <ellipse cx="12" cy="18" rx="7" ry="5" fill="#B7B3DC" />
          <ellipse cx="17" cy="18" rx="5" ry="4.5" fill="#B7B3DC" />
          <ellipse cx="14.5" cy="20" rx="9" ry="4" fill="#B7B3DC" />
        </svg>
      );
    case 'cloud-moon':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden>
          <path d="M21 7.5C18.5 8 17 10.5 17 13.5c0 2.5 1.5 4.5 4 5C18 19 15 16.5 15 13c0-3.5 2.5-6 6-5.5z" fill="#B7B3DC" opacity="0.7" />
          <ellipse cx="12" cy="19" rx="7" ry="5" fill="#B7B3DC" />
          <ellipse cx="17" cy="19" rx="5" ry="4.5" fill="#B7B3DC" />
          <ellipse cx="14.5" cy="21" rx="9" ry="4" fill="#B7B3DC" />
        </svg>
      );
    case 'cloud':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden>
          <ellipse cx="12" cy="15" rx="7" ry="5.5" fill="#8B7CFF" opacity="0.5" />
          <ellipse cx="17" cy="15" rx="5.5" ry="5" fill="#8B7CFF" opacity="0.5" />
          <ellipse cx="14" cy="18" rx="9.5" ry="4.5" fill="#8B7CFF" opacity="0.6" />
        </svg>
      );
    case 'fog':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden>
          {[10,14,18].map(y => (
            <line key={y} x1="5" y1={y} x2="23" y2={y} stroke="#B7B3DC" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          ))}
        </svg>
      );
    case 'drizzle':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden>
          <ellipse cx="12" cy="11" rx="6.5" ry="5" fill="#8B7CFF" opacity="0.4" />
          <ellipse cx="17" cy="12" rx="5" ry="4.5" fill="#8B7CFF" opacity="0.4" />
          <ellipse cx="14" cy="14" rx="9" ry="3.5" fill="#8B7CFF" opacity="0.5" />
          {[9,14,19].map(x => (
            <line key={x} x1={x} y1="19" x2={x - 2} y2="24" stroke="#56E0FF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          ))}
        </svg>
      );
    case 'rain':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden>
          <ellipse cx="12" cy="11" rx="6.5" ry="5" fill="#8B7CFF" opacity="0.5" />
          <ellipse cx="17" cy="11" rx="5" ry="4.5" fill="#8B7CFF" opacity="0.5" />
          <ellipse cx="14" cy="14" rx="9" ry="3.5" fill="#8B7CFF" opacity="0.6" />
          {[8,13,18].map(x => (
            <line key={x} x1={x} y1="18" x2={x - 3} y2="25" stroke="#56E0FF" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          ))}
        </svg>
      );
    case 'snow':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden>
          <ellipse cx="12" cy="11" rx="6.5" ry="5" fill="#B7B3DC" opacity="0.5" />
          <ellipse cx="17" cy="11" rx="5" ry="4.5" fill="#B7B3DC" opacity="0.5" />
          <ellipse cx="14" cy="14" rx="9" ry="3.5" fill="#B7B3DC" opacity="0.6" />
          {[8,14,20].map((x, i) => (
            <text key={i} x={x} y="25" fontSize="7" fill="#EEEDFE" opacity="0.8" textAnchor="middle">❄</text>
          ))}
        </svg>
      );
    case 'storm':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden>
          <ellipse cx="12" cy="10" rx="6.5" ry="5" fill="#534AB7" opacity="0.7" />
          <ellipse cx="17" cy="10" rx="5" ry="4.5" fill="#534AB7" opacity="0.7" />
          <ellipse cx="14" cy="13" rx="9" ry="3.5" fill="#534AB7" opacity="0.8" />
          <path d="M13 17l-4 6h4l-2 4 8-7h-5z" fill="#FFCB5C" />
        </svg>
      );
    default:
      return null;
  }

  // silence "c is unused" — used for future radius calculations
  void c;
}
