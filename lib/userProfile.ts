'use client';

export interface UserProfile {
  userId: string;
  name: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  email: string;
  avatarUrl?: string;
  initials: string;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function loadProfile(userId: string): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`profile-${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`profile-${profile.userId}`, JSON.stringify(profile));
}
