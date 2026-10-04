// localStorage-based case storage — no backend required for prototype

import { Case, JourneyType } from './types';
import { getChecklistForJourney } from './rules-engine';

const STORAGE_KEY = 'adhikarsetu_cases';

function generateId(): string {
  return `AS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function loadAll(): Case[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Case[];
  } catch {
    return [];
  }
}

function saveAll(cases: Case[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
}

export const storage = {
  getAllCases(): Case[] {
    return loadAll().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  getCase(id: string): Case | null {
    return loadAll().find((c) => c.id === id) ?? null;
  },

  createCase(
    journeyType: JourneyType,
    claimantName: string,
    deceasedName?: string,
    companyName?: string,
    folioNumber?: string
  ): Case {
    const now = new Date().toISOString();
    const newCase: Case = {
      id: generateId(),
      journeyType,
      status: 'DRAFT',
      createdAt: now,
      updatedAt: now,
      claimantName,
      deceasedName,
      companyName,
      folioNumber,
      documents: [],
      checklist: getChecklistForJourney(journeyType),
      nameMismatches: [],
      readinessScore: 0,
    };
    const cases = loadAll();
    cases.push(newCase);
    saveAll(cases);
    return newCase;
  },

  updateCase(updated: Case): Case {
    const cases = loadAll();
    const idx = cases.findIndex((c) => c.id === updated.id);
    const withTimestamp = { ...updated, updatedAt: new Date().toISOString() };
    if (idx === -1) {
      cases.push(withTimestamp);
    } else {
      cases[idx] = withTimestamp;
    }
    saveAll(cases);
    return withTimestamp;
  },

  deleteCase(id: string): void {
    const cases = loadAll().filter((c) => c.id !== id);
    saveAll(cases);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },
};
