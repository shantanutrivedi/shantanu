'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { usePalette } from '@/lib/palette';

interface Invite { email: string; sentAt: string; }

function storageKey(userId: string) { return `invites-${userId}`; }

function loadInvites(userId: string): Invite[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveInvites(userId: string, invites: Invite[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(invites));
}

export default function InvitePage() {
  const p = usePalette();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/'); return; }
    if (status === 'authenticated' && session?.user?.id) {
      setInvites(loadInvites(session.user.id));
      setInviteUrl(window.location.origin);
    }
  }, [status, session, router]);

  function handleAdd() {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes('@') || !session?.user?.id) return;
    const existing = invites.find(i => i.email === e);
    if (existing) return;
    const updated = [{ email: e, sentAt: new Date().toISOString() }, ...invites];
    setInvites(updated);
    saveInvites(session.user.id, updated);
    setEmail('');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleRemove(email: string) {
    if (!session?.user?.id) return;
    const updated = invites.filter(i => i.email !== email);
    setInvites(updated);
    saveInvites(session.user.id, updated);
  }

  function handleCopy() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  if (status === 'loading' || status === 'unauthenticated') return null;

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '11px 16px', borderRadius: 10, fontSize: 14,
    background: p.inputBg, border: `1px solid ${p.border}`,
    color: p.textPrimary, fontFamily: "'Inter',sans-serif", outline: 'none',
  };

  return (
    <div style={{ background: p.pageBg, minHeight: '100vh', color: p.textPrimary, position: 'relative' }}>
      {p.glow && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse at 70% 10%, rgba(139,124,255,0.14), transparent 50%)',
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto', padding: '44px 32px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: p.violet, fontFamily: "'JetBrains Mono',monospace", marginBottom: 8,
          }}>
            Team Access
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 32,
            letterSpacing: '-1px', color: p.textPrimary, margin: '0 0 8px',
          }}>
            Invite your team
          </h1>
          <p style={{ color: p.textMuted, fontSize: 14, fontFamily: "'Inter',sans-serif", margin: 0 }}>
            Share the invite link so teammates can sign in with their Google account.
          </p>
        </div>

        {/* Invite link */}
        <div style={{
          background: p.cardBg, border: `1px solid ${p.border}`,
          borderRadius: 16, padding: '24px', marginBottom: 24,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
            color: p.textMuted, fontFamily: "'JetBrains Mono',monospace", marginBottom: 12,
          }}>
            Shareable link
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              flex: 1, padding: '11px 14px', borderRadius: 10, fontSize: 13,
              background: p.rowBg, border: `1px solid ${p.borderTint}`,
              color: p.textBody, fontFamily: "'JetBrains Mono',monospace",
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {inviteUrl || 'Loading…'}
            </div>
            <button
              onClick={handleCopy}
              style={{
                padding: '11px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                fontFamily: "'Space Grotesk',sans-serif',",
                background: copied ? `${p.lime}18` : p.inputBg,
                border: `1px solid ${copied ? `${p.lime}40` : p.border}`,
                color: copied ? p.lime : p.textBody,
                transition: 'all 0.18s', whiteSpace: 'nowrap',
              }}
            >
              {copied ? '✓ Copied!' : 'Copy link'}
            </button>
          </div>
          <p style={{ fontSize: 12, color: p.textMuted, fontFamily: "'Inter',sans-serif", margin: '10px 0 0' }}>
            Anyone with this link can sign in with Google and get their own private workspace.
          </p>
        </div>

        {/* Track by email */}
        <div style={{
          background: p.cardBg, border: `1px solid ${p.border}`,
          borderRadius: 16, padding: '24px', marginBottom: 24,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
            color: p.textMuted, fontFamily: "'JetBrains Mono',monospace", marginBottom: 12,
          }}>
            Track who you invited
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="colleague@company.com"
              style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = p.violet}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = p.border}
            />
            <button
              onClick={handleAdd}
              disabled={!email.trim() || !email.includes('@')}
              style={{
                padding: '11px 20px', borderRadius: 10, border: 'none',
                cursor: !email.trim() || !email.includes('@') ? 'not-allowed' : 'pointer',
                background: added ? `${p.lime}20` : 'linear-gradient(135deg,#534AB7,#7F77DD)',
                color: added ? p.lime : '#EEEDFE',
                fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif",
                transition: 'all 0.18s', opacity: !email.trim() || !email.includes('@') ? 0.5 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {added ? '✓ Added' : '+ Add'}
            </button>
          </div>
        </div>

        {/* Invite list */}
        {invites.length > 0 && (
          <div style={{
            background: p.cardBg, border: `1px solid ${p.border}`, borderRadius: 16, overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 24px', borderBottom: `1px solid ${p.borderTint}`,
              fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
              color: p.textMuted, fontFamily: "'JetBrains Mono',monospace",
            }}>
              Invited ({invites.length})
            </div>
            {invites.map((inv, i) => (
              <div key={inv.email} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px',
                borderBottom: i < invites.length - 1 ? `1px solid ${p.borderTint}` : 'none',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: p.inputBg, border: `1px solid ${p.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: p.violet, fontFamily: "'Space Grotesk',sans-serif",
                }}>
                  {inv.email[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: p.textPrimary, fontFamily: "'Inter',sans-serif", fontWeight: 500 }}>
                    {inv.email}
                  </div>
                  <div style={{ fontSize: 11, color: p.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                    Added {new Date(inv.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <span style={{
                  fontSize: 10, padding: '3px 10px', borderRadius: 100,
                  background: `${p.lime}12`, color: p.lime, border: `1px solid ${p.lime}28`,
                  fontFamily: "'JetBrains Mono',monospace", fontWeight: 600,
                }}>
                  Invited
                </span>
                <button
                  onClick={() => handleRemove(inv.email)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: p.textMuted, fontSize: 16, padding: 4, lineHeight: 1,
                  }}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {invites.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: p.rowBg, border: `1px dashed ${p.border}`, borderRadius: 16,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
            <div style={{ fontSize: 14, color: p.textMuted, fontFamily: "'Inter',sans-serif" }}>
              No invites tracked yet. Add an email above to keep track.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
