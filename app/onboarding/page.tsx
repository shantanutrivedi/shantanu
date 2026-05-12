'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { usePalette } from '@/lib/palette';
import { saveProfile, loadProfile, getInitials, type UserProfile } from '@/lib/userProfile';

const GENDER_OPTIONS = [
  { value: 'male',               label: 'He / Him' },
  { value: 'female',             label: 'She / Her' },
  { value: 'other',              label: 'They / Them' },
  { value: 'prefer_not_to_say',  label: 'Prefer not to say' },
] as const;

function ShantanuMark({ size = 36 }: { size?: number }) {
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

export default function OnboardingPage() {
  const p = usePalette();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [name, setName] = useState('');
  const [gender, setGender] = useState<UserProfile['gender']>('prefer_not_to_say');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/'); return; }
    if (status === 'authenticated' && session?.user?.id) {
      const existing = loadProfile(session.user.id);
      if (existing) { router.replace('/dashboard'); return; }
      if (session.user.name) setName(session.user.name);
    }
  }, [status, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !session?.user?.id) return;
    setSaving(true);
    const profile: UserProfile = {
      userId: session.user.id,
      name: name.trim(),
      gender,
      email: session.user.email ?? '',
      avatarUrl: session.user.image ?? undefined,
      initials: getInitials(name.trim()),
    };
    saveProfile(profile);
    router.push('/dashboard');
  }

  if (status === 'loading' || status === 'unauthenticated') return null;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 15,
    background: p.inputBg, border: `1px solid ${p.border}`,
    color: p.textPrimary, fontFamily: "'Inter',sans-serif", outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)', background: p.pageBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', position: 'relative',
    }}>
      {p.glow && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse at 50% 30%, rgba(139,124,255,0.14), transparent 60%)',
        }} />
      )}

      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 480,
        background: p.cardBg, border: `1px solid ${p.border}`,
        borderRadius: 24, padding: '48px 40px',
        boxShadow: p.glow ? '0 24px 80px rgba(0,0,0,0.45)' : '0 8px 40px rgba(83,74,183,0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <ShantanuMark size={42} />
          <h1 style={{
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 26,
            letterSpacing: '-0.5px', color: p.textPrimary, margin: '16px 0 8px',
          }}>
            Set up your profile
          </h1>
          <p style={{ color: p.textMuted, fontSize: 13, fontFamily: "'Inter',sans-serif", margin: 0 }}>
            Just two quick things before we get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em',
              textTransform: 'uppercase', color: p.textMuted, fontFamily: "'JetBrains Mono',monospace",
              marginBottom: 8,
            }}>
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Shantanu Trivedi"
              required
              style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = p.violet}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = p.border}
            />
          </div>

          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em',
              textTransform: 'uppercase', color: p.textMuted, fontFamily: "'JetBrains Mono',monospace",
              marginBottom: 10,
            }}>
              Pronouns
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {GENDER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(opt.value)}
                  style={{
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
                    fontFamily: "'Inter',sans-serif", fontWeight: gender === opt.value ? 600 : 400,
                    background: gender === opt.value ? `${p.violet}18` : p.inputBg,
                    border: `1px solid ${gender === opt.value ? p.violet : p.border}`,
                    color: gender === opt.value ? p.violet : p.textBody,
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {name.trim() && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 12,
              background: p.rowBg, border: `1px solid ${p.borderTint}`,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg,#534AB7,#7F77DD)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#EEEDFE',
                fontFamily: "'Space Grotesk',sans-serif",
                flexShrink: 0,
                boxShadow: p.glow ? '0 0 16px rgba(139,124,255,0.4)' : '0 2px 8px rgba(83,74,183,0.25)',
              }}>
                {getInitials(name.trim())}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: p.textPrimary, fontFamily: "'Space Grotesk',sans-serif" }}>
                  {name.trim()}
                </div>
                <div style={{ fontSize: 11, color: p.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                  {session?.user?.email}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!name.trim() || saving}
            style={{
              width: '100%', padding: '14px 24px', borderRadius: 12, border: 'none',
              cursor: !name.trim() || saving ? 'not-allowed' : 'pointer',
              background: !name.trim() || saving ? 'rgba(83,74,183,0.3)' : 'linear-gradient(135deg,#534AB7,#7F77DD)',
              color: '#EEEDFE', fontSize: 15, fontWeight: 700,
              fontFamily: "'Space Grotesk',sans-serif",
              boxShadow: !name.trim() || saving ? 'none' : (p.glow ? '0 0 22px rgba(83,74,183,0.5)' : '0 4px 14px rgba(83,74,183,0.35)'),
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Saving…' : 'Enter Dashboard →'}
          </button>
        </form>
      </div>
    </div>
  );
}
