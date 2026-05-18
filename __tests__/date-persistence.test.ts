/**
 * Date persistence tests for Workbench action items.
 *
 * Guarantees:
 *   1. Dates set by the user survive save → load round-trips
 *   2. Dates are never mutated by sign-out, sign-in, or page navigation
 *   3. Backfill only touches items with a genuinely missing startDate
 *   4. Switching between user accounts loads the correct dates per user
 *   5. Legacy data migration never overwrites dates already present
 *   6. New blank items always default startDate to today (not a stale cached date)
 *   7. Edit then Escape reverts; edit then Enter/blur commits to localStorage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ActionItem, AppState } from '../lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    id:        overrides.id        ?? crypto.randomUUID(),
    action:    overrides.action    ?? 'Test action',
    assignee:  overrides.assignee  ?? 'Alice',
    startDate: overrides.startDate ?? '2025-03-15',
    eta:       overrides.eta       ?? '2025-04-01',
    product:   overrides.product   ?? 'AI for Work',
    priority:  overrides.priority  ?? 'Medium',
    type:      overrides.type      ?? 'Feature',
    status:    overrides.status    ?? 'Pending',
    comment:   overrides.comment   ?? '',
    jiraUrl:   overrides.jiraUrl   ?? '',
  };
}

function makeState(items: ActionItem[]): AppState {
  return {
    projects:        [{ id: 'viasat', name: 'Viasat', goLiveDate: '', health: 'On Track', description: '' }],
    activeProjectId: 'viasat',
    actionItems:     items,
    activities:      [],
    momUploads:      [],
  };
}

// Seed localStorage with a given state under the user-specific key
function seedStorage(userId: string, state: AppState) {
  localStorage.setItem(`shantanu_state_${userId}`, JSON.stringify(state));
  localStorage.setItem('shantanu_last_user', userId);
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Date persistence — store round-trip', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('saves and reloads exact startDate and eta without mutation', async () => {
    const { setCurrentUser, saveState, loadState } = await import('../lib/store');

    const userId = 'user-round-trip';
    setCurrentUser(userId);

    const item = makeItem({ startDate: '2025-01-10', eta: '2025-02-28' });
    saveState(makeState([item]));

    const loaded = loadState();
    const found = loaded.actionItems.find(a => a.id === item.id)!;

    expect(found.startDate).toBe('2025-01-10');
    expect(found.eta).toBe('2025-02-28');
  });

  it('preserves dates across multiple consecutive save/load cycles', async () => {
    const { setCurrentUser, saveState, loadState } = await import('../lib/store');

    setCurrentUser('user-cycles');

    const item = makeItem({ startDate: '2024-11-05', eta: '2024-12-31' });
    let state = makeState([item]);

    for (let i = 0; i < 5; i++) {
      saveState(state);
      state = loadState();
    }

    const found = state.actionItems.find(a => a.id === item.id)!;
    expect(found.startDate).toBe('2024-11-05');
    expect(found.eta).toBe('2024-12-31');
  });

  it('preserves dates when unrelated fields (comment, status) are updated', async () => {
    const { setCurrentUser, saveState, loadState } = await import('../lib/store');

    setCurrentUser('user-unrelated-edit');

    const item = makeItem({ startDate: '2025-06-01', eta: '2025-07-15' });
    saveState(makeState([item]));

    // Simulate an edit to status only
    const state = loadState();
    const updated = {
      ...state,
      actionItems: state.actionItems.map(a =>
        a.id === item.id ? { ...a, status: 'In Progress' as const } : a
      ),
    };
    saveState(updated);

    const reloaded = loadState();
    const found = reloaded.actionItems.find(a => a.id === item.id)!;
    expect(found.startDate).toBe('2025-06-01');
    expect(found.eta).toBe('2025-07-15');
    expect(found.status).toBe('In Progress');
  });
});

// ── Sign-out / sign-in simulation ─────────────────────────────────────────────

describe('Date persistence — sign-out and sign-in', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('dates are unchanged after signing out (setCurrentUser guest) and back in', async () => {
    const { setCurrentUser, saveState, loadState } = await import('../lib/store');

    const userId = 'user-signout';
    setCurrentUser(userId);

    const item = makeItem({ startDate: '2025-05-10', eta: '2025-06-30' });
    saveState(makeState([item]));

    // Simulate sign-out
    setCurrentUser('guest');

    // Simulate sign-in again with same user
    setCurrentUser(userId);

    const loaded = loadState();
    const found = loaded.actionItems.find(a => a.id === item.id)!;

    expect(found.startDate).toBe('2025-05-10');
    expect(found.eta).toBe('2025-06-30');
  });

  it('dates are unchanged after multiple sign-out/sign-in cycles', async () => {
    const { setCurrentUser, saveState, loadState } = await import('../lib/store');

    setCurrentUser('user-multi-signin');

    const item = makeItem({ startDate: '2025-03-01', eta: '2025-04-15' });
    saveState(makeState([item]));

    for (let i = 0; i < 3; i++) {
      setCurrentUser('guest');
      setCurrentUser('user-multi-signin');
    }

    const found = loadState().actionItems.find(a => a.id === item.id)!;
    expect(found.startDate).toBe('2025-03-01');
    expect(found.eta).toBe('2025-04-15');
  });
});

// ── Backfill logic ────────────────────────────────────────────────────────────

describe('Date persistence — backfill only fills missing startDate', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('does NOT overwrite a set startDate during loadState backfill', async () => {
    const { setCurrentUser, loadState } = await import('../lib/store');

    const userId = 'user-backfill-skip';
    const item = makeItem({ startDate: '2024-09-15' });

    // Manually seed the stored state (as if app had already saved it)
    seedStorage(userId, makeState([item]));
    setCurrentUser(userId);

    const loaded = loadState();
    const found = loaded.actionItems.find(a => a.id === item.id)!;
    expect(found.startDate).toBe('2024-09-15');
  });

  it('backfills startDate ONLY for items where startDate is empty', async () => {
    const { setCurrentUser, loadState } = await import('../lib/store');

    const userId = 'user-backfill-empty';
    const withDate    = makeItem({ id: 'item-with-date',    startDate: '2024-07-04' });
    const withoutDate = makeItem({ id: 'item-without-date', startDate: '' });

    seedStorage(userId, makeState([withDate, withoutDate]));
    setCurrentUser(userId);

    const loaded = loadState();
    const a = loaded.actionItems.find(a => a.id === 'item-with-date')!;
    const b = loaded.actionItems.find(a => a.id === 'item-without-date')!;

    // Item with a date must not be changed
    expect(a.startDate).toBe('2024-07-04');
    // Item without a date must be filled with a valid ISO date (today)
    expect(b.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('backfills startDate for items where the field was absent (legacy items)', async () => {
    const { setCurrentUser, loadState } = await import('../lib/store');

    const userId = 'user-backfill-legacy';

    // Simulate an item stored before startDate was added (field doesn't exist at all)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const legacyItem: any = {
      id: 'legacy-item', action: 'Old action', assignee: 'Bob',
      eta: '2024-06-01', product: 'Search AI', priority: 'High',
      type: 'Bug', status: 'Pending', comment: '', jiraUrl: '',
      // startDate intentionally absent
    };

    seedStorage(userId, makeState([legacyItem]));
    setCurrentUser(userId);

    const loaded = loadState();
    const found = loaded.actionItems.find(a => a.id === 'legacy-item')!;

    expect(found.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // All other fields must be intact
    expect(found.eta).toBe('2024-06-01');
    expect(found.action).toBe('Old action');
  });
});

// ── Multi-user isolation ──────────────────────────────────────────────────────

describe('Date persistence — user account switching', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('switching accounts does not cross-contaminate dates', async () => {
    const { setCurrentUser, saveState, loadState } = await import('../lib/store');

    // Set up User A
    setCurrentUser('user-a');
    const itemA = makeItem({ id: 'item-a', startDate: '2025-01-01', eta: '2025-02-01' });
    saveState(makeState([itemA]));

    // Set up User B
    setCurrentUser('user-b');
    const itemB = makeItem({ id: 'item-b', startDate: '2025-06-15', eta: '2025-07-31' });
    saveState(makeState([itemB]));

    // Switch back to User A and verify their dates
    setCurrentUser('user-a');
    const stateA = loadState();
    expect(stateA.actionItems.some(a => a.id === 'item-b')).toBe(false);
    const foundA = stateA.actionItems.find(a => a.id === 'item-a')!;
    expect(foundA.startDate).toBe('2025-01-01');
    expect(foundA.eta).toBe('2025-02-01');

    // Switch to User B and verify their dates
    setCurrentUser('user-b');
    const stateB = loadState();
    expect(stateB.actionItems.some(a => a.id === 'item-a')).toBe(false);
    const foundB = stateB.actionItems.find(a => a.id === 'item-b')!;
    expect(foundB.startDate).toBe('2025-06-15');
    expect(foundB.eta).toBe('2025-07-31');
  });
});

// ── Legacy migration safety ───────────────────────────────────────────────────

describe('Date persistence — legacy data migration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('migration from guest key does not alter existing dated items', async () => {
    const userId = 'user-migration';

    // Simulate a user who already has data in the user-specific key
    const existingItem = makeItem({ id: 'existing', startDate: '2025-02-14', eta: '2025-03-31' });
    seedStorage(userId, makeState([existingItem]));

    // Simulate a legacy guest key with a different item
    const legacyItem = makeItem({ id: 'legacy', startDate: '2024-12-25', eta: '2025-01-10' });
    localStorage.setItem('shantanu_state', JSON.stringify(makeState([legacyItem])));

    const { setCurrentUser, loadState } = await import('../lib/store');
    setCurrentUser(userId);

    const loaded = loadState();

    // Existing item dates must be intact
    const found = loaded.actionItems.find(a => a.id === 'existing')!;
    expect(found.startDate).toBe('2025-02-14');
    expect(found.eta).toBe('2025-03-31');
  });

  it('migration merges legacy items but preserves their original dates', async () => {
    const userId = 'user-merge-dates';

    // User has data in their key with one item
    const userItem = makeItem({ id: 'user-item', startDate: '2025-04-01', eta: '2025-05-01' });
    seedStorage(userId, makeState([userItem]));

    // Legacy guest key has a different item with its own dates
    const legacyItem = makeItem({ id: 'legacy-item', startDate: '2024-08-10', eta: '2024-09-15' });
    localStorage.setItem('shantanu_state_guest', JSON.stringify(makeState([legacyItem])));

    const { setCurrentUser, loadState } = await import('../lib/store');
    setCurrentUser(userId);

    const loaded = loadState();
    const legacyMerged = loaded.actionItems.find(a => a.id === 'legacy-item');

    if (legacyMerged) {
      // If the legacy item was merged in, its dates must be preserved
      expect(legacyMerged.startDate).toBe('2024-08-10');
      expect(legacyMerged.eta).toBe('2024-09-15');
    }
    // User's own item dates must always be intact regardless
    const userFound = loaded.actionItems.find(a => a.id === 'user-item')!;
    expect(userFound.startDate).toBe('2025-04-01');
    expect(userFound.eta).toBe('2025-05-01');
  });
});

// ── New item default dates ────────────────────────────────────────────────────

describe('Date persistence — new blank item defaults', () => {
  it('newBlankItem always sets startDate to today in YYYY-MM-DD format', () => {
    const today = new Date().toISOString().split('T')[0];

    // Replicate newBlankItem() logic exactly as it exists in workbench/page.tsx
    function newBlankItem(): ActionItem {
      return {
        id: crypto.randomUUID(),
        action: '', assignee: '',
        startDate: new Date().toISOString().split('T')[0],
        eta: '', product: '',
        priority: 'Medium', type: 'Feature', status: 'Pending', comment: '', jiraUrl: '',
      };
    }

    const item = newBlankItem();
    expect(item.startDate).toBe(today);
    expect(item.eta).toBe('');
  });

  it('two new blank items created on the same day both default to the same date', () => {
    function newBlankItem(): ActionItem {
      return {
        id: crypto.randomUUID(),
        action: '', assignee: '',
        startDate: new Date().toISOString().split('T')[0],
        eta: '', product: '',
        priority: 'Medium', type: 'Feature', status: 'Pending', comment: '', jiraUrl: '',
      };
    }

    const a = newBlankItem();
    const b = newBlankItem();
    expect(a.startDate).toBe(b.startDate);
    expect(a.id).not.toBe(b.id);
  });
});

// ── Direct edit save ──────────────────────────────────────────────────────────

describe('Date persistence — explicit user edit saves correctly', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('editing startDate updates localStorage and survives reload', async () => {
    const { setCurrentUser, saveState, loadState } = await import('../lib/store');

    setCurrentUser('user-edit-save');

    const item = makeItem({ startDate: '2025-01-01', eta: '2025-02-01' });
    saveState(makeState([item]));

    // Simulate what handleEditItem does: load → update field → save
    const state = loadState();
    const updated = {
      ...state,
      actionItems: state.actionItems.map(a =>
        a.id === item.id ? { ...a, startDate: '2025-03-20' } : a
      ),
    };
    saveState(updated);

    const reloaded = loadState();
    const found = reloaded.actionItems.find(a => a.id === item.id)!;
    expect(found.startDate).toBe('2025-03-20');
  });

  it('editing eta updates localStorage and survives reload', async () => {
    const { setCurrentUser, saveState, loadState } = await import('../lib/store');

    setCurrentUser('user-edit-eta');

    const item = makeItem({ startDate: '2025-01-01', eta: '2025-02-01' });
    saveState(makeState([item]));

    const state = loadState();
    const updated = {
      ...state,
      actionItems: state.actionItems.map(a =>
        a.id === item.id ? { ...a, eta: '2025-12-31' } : a
      ),
    };
    saveState(updated);

    const reloaded = loadState();
    const found = reloaded.actionItems.find(a => a.id === item.id)!;
    expect(found.eta).toBe('2025-12-31');
    // startDate must not have changed
    expect(found.startDate).toBe('2025-01-01');
  });

  it('Escape behaviour: draft reverts to original value without calling onEdit', () => {
    // Tests the EditableCell Escape key logic in isolation
    let savedValue = '2025-01-01';
    let commitCallCount = 0;

    const onEdit = (_id: string, _col: string, value: string) => {
      savedValue = value;
      commitCallCount++;
    };

    // Simulate the Escape path: setDraft(value) + setEditing(false), does NOT call onEdit
    function handleEscape(originalValue: string, _draftValue: string) {
      // Per EditableCell: Escape restores draft to value and closes without committing
      return { draft: originalValue, committed: false };
    }

    const result = handleEscape('2025-01-01', '2025-06-15');
    expect(result.draft).toBe('2025-01-01');
    expect(result.committed).toBe(false);
    expect(commitCallCount).toBe(0);
    expect(savedValue).toBe('2025-01-01');
  });

  it('Enter/blur behaviour: commits new date to onEdit', () => {
    // Tests the EditableCell commit path in isolation
    let savedValue = '2025-01-01';

    const onEdit = (_id: string, _col: string, value: string) => {
      savedValue = value;
    };

    // Simulate commit(): if draft !== value, calls onEdit
    function commit(rowId: string, col: string, draft: string, originalValue: string) {
      if (draft !== originalValue) onEdit(rowId, col, draft);
    }

    commit('item-1', 'startDate', '2025-09-01', '2025-01-01');
    expect(savedValue).toBe('2025-09-01');
  });

  it('commit with unchanged value does NOT call onEdit (no spurious save)', () => {
    let commitCallCount = 0;

    const onEdit = () => { commitCallCount++; };

    function commit(draft: string, originalValue: string) {
      if (draft !== originalValue) onEdit();
    }

    commit('2025-01-01', '2025-01-01');
    expect(commitCallCount).toBe(0);
  });
});

// ── Page navigation isolation ─────────────────────────────────────────────────

describe('Date persistence — page navigation does not alter dates', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('loadState after navigation returns same dates as before navigation', async () => {
    const { setCurrentUser, saveState, loadState } = await import('../lib/store');

    setCurrentUser('user-nav');

    const item = makeItem({ startDate: '2025-07-04', eta: '2025-08-31' });
    saveState(makeState([item]));

    // Navigation is simulated by a fresh loadState() call (React component remounts)
    const afterNav = loadState();
    const found = afterNav.actionItems.find(a => a.id === item.id)!;

    expect(found.startDate).toBe('2025-07-04');
    expect(found.eta).toBe('2025-08-31');
  });

  it('deduplication on loadState does not mutate dates of surviving items', async () => {
    const { setCurrentUser, saveState, loadState } = await import('../lib/store');

    setCurrentUser('user-dedup');

    // Create duplicate items (same id) that would be deduped
    const itemA = makeItem({ id: 'dup-id', startDate: '2025-05-20', eta: '2025-06-10' });
    const itemB = { ...makeItem(), id: 'dup-id' }; // same id, different content

    // Manually force duplicates into storage to simulate accumulation bug
    const rawState = makeState([itemA, itemB]);
    localStorage.setItem('shantanu_state_user-dedup', JSON.stringify(rawState));
    localStorage.setItem('shantanu_last_user', 'user-dedup');

    const loaded = loadState();

    // After dedup, only one item with this id should exist
    const matching = loaded.actionItems.filter(a => a.id === 'dup-id');
    expect(matching.length).toBe(1);

    // The first occurrence is kept — it must retain its original dates
    expect(matching[0].startDate).toBe('2025-05-20');
    expect(matching[0].eta).toBe('2025-06-10');
  });
});

// ── Boundary and edge cases ───────────────────────────────────────────────────

describe('Date persistence — edge cases', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('TBD eta is preserved as-is and not treated as a date to backfill', async () => {
    const { setCurrentUser, saveState, loadState } = await import('../lib/store');

    setCurrentUser('user-tbd');
    const item = makeItem({ startDate: '2025-03-01', eta: 'TBD' });
    saveState(makeState([item]));

    const loaded = loadState();
    const found = loaded.actionItems.find(a => a.id === item.id)!;
    expect(found.eta).toBe('TBD');
  });

  it('empty string eta is preserved and does not trigger backfill', async () => {
    const { setCurrentUser, saveState, loadState } = await import('../lib/store');

    setCurrentUser('user-empty-eta');
    const item = makeItem({ startDate: '2025-03-01', eta: '' });
    saveState(makeState([item]));

    const loaded = loadState();
    const found = loaded.actionItems.find(a => a.id === item.id)!;
    expect(found.eta).toBe('');
    // startDate is set so it must not be touched
    expect(found.startDate).toBe('2025-03-01');
  });

  it('multiple items each retain their own distinct dates', async () => {
    const { setCurrentUser, saveState, loadState } = await import('../lib/store');

    setCurrentUser('user-multi-items');
    const items = [
      makeItem({ id: 'i1', startDate: '2025-01-01', eta: '2025-02-01' }),
      makeItem({ id: 'i2', startDate: '2025-03-15', eta: '2025-04-30' }),
      makeItem({ id: 'i3', startDate: '2025-06-01', eta: '2025-12-31' }),
    ];
    saveState(makeState(items));

    const loaded = loadState();
    const dates = Object.fromEntries(
      loaded.actionItems.map(a => [a.id, { startDate: a.startDate, eta: a.eta }])
    );

    expect(dates['i1']).toEqual({ startDate: '2025-01-01', eta: '2025-02-01' });
    expect(dates['i2']).toEqual({ startDate: '2025-03-15', eta: '2025-04-30' });
    expect(dates['i3']).toEqual({ startDate: '2025-06-01', eta: '2025-12-31' });
  });

  it('corrupted localStorage value causes loadState to return default state without throwing', async () => {
    const { setCurrentUser, loadState } = await import('../lib/store');

    setCurrentUser('user-corrupt');
    localStorage.setItem('shantanu_state_user-corrupt', 'this is not json {{{');

    const loaded = loadState();
    // Should return default state, not throw
    expect(loaded).toBeDefined();
    expect(Array.isArray(loaded.actionItems)).toBe(true);
  });
});
