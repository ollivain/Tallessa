import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { saveMemorialSpaces, saveActiveMemorialSpaceId } from '../storage/storage';

let idCounter = 1;
const nextId = () => `id-${Date.now().toString(36)}-${idCounter++}`;

const MemorialContext = createContext(null);

/**
 * initialMemorials and initialActiveId come from the top-level loadAppState()
 * call in App.js, so this provider never touches storage directly on mount —
 * it only writes back when data changes.
 */
export function MemorialProvider({ initialMemorials, initialActiveId, children }) {
  const [memorials, setMemorials] = useState(() => initialMemorials ?? []);
  const [activeId, setActiveId] = useState(() => initialActiveId ?? null);

  // Skip the first render so we don't immediately write the loaded data
  // back to storage on mount (nothing has changed yet).
  const skipSaveRef = useRef(true);
  useEffect(() => {
    if (skipSaveRef.current) { skipSaveRef.current = false; return; }
    saveMemorialSpaces(memorials);
  }, [memorials]);

  const skipActiveRef = useRef(true);
  useEffect(() => {
    if (skipActiveRef.current) { skipActiveRef.current = false; return; }
    saveActiveMemorialSpaceId(activeId);
  }, [activeId]);

  const activeMemorial = useMemo(
    () => memorials.find((m) => m.id === activeId) ?? null,
    [memorials, activeId],
  );

  const selectMemorial = useCallback((id) => setActiveId(id), []);
  const clearActive    = useCallback(() => setActiveId(null), []);

  // ── Create ─────────────────────────────────────────────────────────────────

  const createMemorial = useCallback((draft) => {
    const memorial = {
      id: nextId(),
      memories: [],
      letters: [],
      events: [],
      candleLit: false,
      ...draft,
    };
    setMemorials((prev) => [...prev, memorial]);
    setActiveId(memorial.id);
    return memorial;
  }, []);

  // ── Memorial-level updates ─────────────────────────────────────────────────

  const updateMemorial = useCallback((memorialId, changes) => {
    setMemorials((prev) =>
      prev.map((m) => m.id === memorialId ? { ...m, ...changes } : m),
    );
  }, []);

  const deleteMemorial = useCallback((memorialId) => {
    setMemorials((prev) => {
      const next = prev.filter((m) => m.id !== memorialId);
      return next;
    });
    setActiveId((prev) => {
      if (prev !== memorialId) return prev;
      // Switch to first remaining memorial or null
      const remaining = memorials.filter((m) => m.id !== memorialId);
      return remaining[0]?.id ?? null;
    });
  }, [memorials]);

  const setCandleLit = useCallback((memorialId, lit) => {
    setMemorials((prev) =>
      prev.map((m) => m.id === memorialId ? { ...m, candleLit: lit } : m),
    );
  }, []);

  // ── Memories ───────────────────────────────────────────────────────────────

  const addMemory = useCallback((memorialId, memory) => {
    setMemorials((prev) =>
      prev.map((m) =>
        m.id === memorialId
          ? { ...m, memories: [{ id: nextId(), ...memory }, ...m.memories] }
          : m,
      ),
    );
  }, []);

  const updateMemory = useCallback((memorialId, memoryId, changes) => {
    setMemorials((prev) =>
      prev.map((m) =>
        m.id === memorialId
          ? {
              ...m,
              memories: m.memories.map((mem) =>
                mem.id === memoryId ? { ...mem, ...changes } : mem,
              ),
            }
          : m,
      ),
    );
  }, []);

  const deleteMemory = useCallback((memorialId, memoryId) => {
    setMemorials((prev) =>
      prev.map((m) =>
        m.id === memorialId
          ? { ...m, memories: m.memories.filter((mem) => mem.id !== memoryId) }
          : m,
      ),
    );
  }, []);

  // ── Letters ────────────────────────────────────────────────────────────────

  const addLetter = useCallback((memorialId, letter) => {
    setMemorials((prev) =>
      prev.map((m) =>
        m.id === memorialId
          ? { ...m, letters: [{ id: nextId(), ...letter }, ...m.letters] }
          : m,
      ),
    );
  }, []);

  const updateLetter = useCallback((memorialId, letterId, changes) => {
    setMemorials((prev) =>
      prev.map((m) =>
        m.id === memorialId
          ? {
              ...m,
              letters: m.letters.map((l) =>
                l.id === letterId ? { ...l, ...changes } : l,
              ),
            }
          : m,
      ),
    );
  }, []);

  const deleteLetter = useCallback((memorialId, letterId) => {
    setMemorials((prev) =>
      prev.map((m) =>
        m.id === memorialId
          ? { ...m, letters: m.letters.filter((l) => l.id !== letterId) }
          : m,
      ),
    );
  }, []);

  // ── Events ─────────────────────────────────────────────────────────────────

  const addEvent = useCallback((memorialId, event) => {
    setMemorials((prev) =>
      prev.map((m) =>
        m.id === memorialId
          ? { ...m, events: [...m.events, { id: nextId(), ...event }] }
          : m,
      ),
    );
  }, []);

  const updateEvent = useCallback((memorialId, eventId, changes) => {
    setMemorials((prev) =>
      prev.map((m) =>
        m.id === memorialId
          ? {
              ...m,
              events: m.events.map((ev) =>
                ev.id === eventId ? { ...ev, ...changes } : ev,
              ),
            }
          : m,
      ),
    );
  }, []);

  const deleteEvent = useCallback((memorialId, eventId) => {
    setMemorials((prev) =>
      prev.map((m) =>
        m.id === memorialId
          ? { ...m, events: m.events.filter((ev) => ev.id !== eventId) }
          : m,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({
      memorials,
      activeMemorial,
      selectMemorial,
      clearActive,
      // Memorial CRUD
      createMemorial,
      updateMemorial,
      deleteMemorial,
      setCandleLit,
      // Memory CRUD
      addMemory,
      updateMemory,
      deleteMemory,
      // Letter CRUD
      addLetter,
      updateLetter,
      deleteLetter,
      // Event CRUD
      addEvent,
      updateEvent,
      deleteEvent,
    }),
    [
      memorials, activeMemorial,
      selectMemorial, clearActive,
      createMemorial, updateMemorial, deleteMemorial, setCandleLit,
      addMemory, updateMemory, deleteMemory,
      addLetter, updateLetter, deleteLetter,
      addEvent, updateEvent, deleteEvent,
    ],
  );

  return <MemorialContext.Provider value={value}>{children}</MemorialContext.Provider>;
}

export function useMemorials() {
  const ctx = useContext(MemorialContext);
  if (!ctx) throw new Error('useMemorials must be used within MemorialProvider');
  return ctx;
}
