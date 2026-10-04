'use client';

import { useState, useEffect, useCallback } from 'react';
import { Case, UploadedDocument } from '@/lib/types';
import { storage } from '@/lib/storage';
import { syncChecklistWithDocuments } from '@/lib/rules-engine';

export function useCase(caseId: string | null) {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }
    const found = storage.getCase(caseId);
    if (found) {
      // Re-sync with latest rules engine on load to ensure truthful state
      const synced = syncChecklistWithDocuments(found);
      setCaseData(synced);
      storage.updateCase(synced);
    } else {
      setCaseData(null);
    }
    setLoading(false);
  }, [caseId]);

  const updateCase = useCallback((updates: Partial<Case>) => {
    if (!caseData) return;
    const merged = { ...caseData, ...updates };
    const synced = syncChecklistWithDocuments(merged);
    const saved = storage.updateCase(synced);
    setCaseData(saved);
    return saved;
  }, [caseData]);

  const toggleChecklistItem = useCallback((itemId: string) => {
    if (!caseData) return;
    const newChecklist = caseData.checklist.map((item) => {
      if (item.id !== itemId) return item;
      const nextCompleted = !item.completed;
      let nextEvidenceStatus = item.evidenceStatus;

      if (!nextCompleted) {
        nextEvidenceStatus = 'MISSING';
      } else {
        // Toggling manually without a verified document can only be USER_CONFIRMED, never VERIFIED
        if (item.evidenceStatus !== 'VERIFIED') {
          nextEvidenceStatus = 'USER_CONFIRMED';
        }
      }

      return {
        ...item,
        completed: nextCompleted,
        evidenceStatus: nextEvidenceStatus,
      };
    });
    updateCase({ checklist: newChecklist });
  }, [caseData, updateCase]);

  // Allows human confirmation of a document that is in NEEDS_REVIEW status
  const confirmReviewDocument = useCallback((docId: string) => {
    if (!caseData) return;
    const updatedDocs = caseData.documents.map((d) => {
      if (d.id !== docId) return d;
      return {
        ...d,
        verified: true,
        validation: d.validation
          ? { ...d.validation, userConfirmed: true, status: 'VALID' as const }
          : undefined,
      };
    });
    updateCase({ documents: updatedDocs });
  }, [caseData, updateCase]);

  return {
    caseData,
    loading,
    updateCase,
    toggleChecklistItem,
    confirmReviewDocument,
    setCaseData,
  };
}

export function useAllCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setCases(storage.getAllCases());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deleteCase = useCallback((id: string) => {
    storage.deleteCase(id);
    setCases((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { cases, loading, refresh, deleteCase };
}
