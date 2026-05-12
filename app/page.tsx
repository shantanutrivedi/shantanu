'use client';
import { signIn } from 'next-auth/react';
import { useTheme } from '@/lib/theme';

function ShantanuMark({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="24" fill="#26215C" />
      <circle cx="30" cy="30" r="17.5" fill="#1e1a4e" />
      <path d="M 22.3 24.2 C 22.3 19 26.1 16.6 30.5 16.6 C 34.9 16.6 37.2 20.8 37.2 25 C 37.2 29.2 33.9 31.3 30.5 33 C 27.1 34.7 23.7 37 23.7 41.5 C 23.7 45.1 27.6 47.5 32 47.5 C 36.4 47.5 38.9 44.5 40.7 41.4"
        fill="none" stroke="#EEEDFE" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="22.3" cy="24.2" r="2.2" fill="#F0997B" />
      <circle cx="40.7" cy="41.4" r="2.2" fill="#F0997B" />
    </svg>
  );
}

const FEATURES = [
  { icon: '⚡', title: 'MOM → Action Table', desc: 'Upload meeting notes, AI extracts every action item in seconds.' },
  { icon: '📊', title: 'Live Dashboard', desc: 'KPIs, Gantt timeline, risks, and go-live status — always in sync.' },
  { icon: '📝', title: 'Daily Activity Log', desc: 'Team entries feed straight into your weekly report.' },
  { icon: '✦', title: 'Executive Summary', desc: 'One click generates a polished AI-written report ready to share.' },
];

export default function SignInPage() {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const pageBg    = dark ? '#1C1C24' : '#F2F1FC';
  const cardBg    = dark ? 'rgba(28,28,36,0.92)' : 'rgba(255,255,255,0.97)';
  const border    = dark ? 'rgba(139,124,255,0.2)' : 'rgba(83,74,183,0.15)';
  const textPrimary = dark ? '#EEEDFE' : '#1C1C24';
  const textMuted   = dark ? '#7B7796' : '#7B7796';
  const textBody    = dark ? '#B7B3DC' : '#3D3960';
  const inputBg     = dark ? 'rgba(139,124,255,0.08)' : 'rgba(83,74,183,0.06)';

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)', background: pageBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', position: 'relative', overflow: 'hidden',
    }}>
      {dark && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse at 20% 30%, rgba(139,124,255,0.15), transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(240,153,123,0.08), transparent 50%)',
        }} />
      )}

      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 940,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center',
      }}>

        {/* Left: Branding */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
            <ShantanuMark size={52} />
            <div>
              <div style={{
                fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: 22,
                letterSpacing: '-1.5px', color: textPrimary, lineHeight: 1,
              }}>
                SHAN<span style={{ color: '#7F77DD' }}>TANU</span>
                <span style={{
                  display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                  background: '#F0997B', marginLeft: 2, verticalAlign: 'super',
                }} />
              </div>
              <div style={{ fontSize: 11, color: textMuted, fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>
                Program Intelligence
              </div>
            </div>
          </div>

          <h1 style={{
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 38,
            letterSpacing: '-1.5px', color: textPrimary, lineHeight: 1.15, margin: '0 0 16px',
          }}>
            Run every project<br />
            <span style={{ color: '#8B7CFF' }}>like a pro.</span>
          </h1>
          <p style={{
            color: textBody, fontSize: 15, lineHeight: 1.65, margin: '0 0 36px',
            fontFamily: "'Inter',sans-serif", maxWidth: 400,
          }}>
            Paste your meeting notes, get an action table. Track progress, log activity, and generate executive summaries — powered by Claude AI.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: inputBg, border: `1px solid ${border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>
                  {f.icon}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 2 }}>
                    {f.title}
                  </div>
                  <div style={{ fontSize: 12, color: textMuted, fontFamily: "'Inter',sans-serif", lineHeight: 1.5 }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Sign-in card */}
        <div style={{
          background: cardBg, border: `1px solid ${border}`, borderRadius: 24,
          padding: '48px 40px',
          boxShadow: dark ? '0 24px 80px rgba(0,0,0,0.5)' : '0 8px 40px rgba(83,74,183,0.12)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: '0 auto 18px',
              background: 'linear-gradient(135deg,#534AB7,#7F77DD)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
              boxShadow: dark ? '0 0 28px rgba(139,124,255,0.45)' : '0 4px 16px rgba(83,74,183,0.3)',
            }}>
              ✦
            </div>
            <h2 style={{
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 26,
              letterSpacing: '-0.5px', color: textPrimary, margin: '0 0 8px',
            }}>
              Welcome back
            </h2>
            <p style={{ color: textMuted, fontSize: 13, fontFamily: "'Inter',sans-serif", margin: 0 }}>
              Sign in to access your project dashboard
            </p>
          </div>

          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              padding: '14px 24px', borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 600,
              fontFamily: "'Space Grotesk',sans-serif", color: textPrimary,
              background: inputBg, border: `1px solid ${border}`,
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = dark ? 'rgba(139,124,255,0.16)' : 'rgba(83,74,183,0.1)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = dark ? '#8B7CFF' : '#5548D9';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = inputBg;
              (e.currentTarget as HTMLButtonElement).style.borderColor = border;
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div style={{
            marginTop: 24, padding: '16px 20px', borderRadius: 12,
            background: inputBg, border: `1px solid ${border}`,
          }}>
            <div style={{
              fontSize: 11, color: textMuted, fontFamily: "'Inter',sans-serif",
              lineHeight: 1.65, textAlign: 'center',
            }}>
              Your data is stored privately per account.<br />
              Invite your team after signing in.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
