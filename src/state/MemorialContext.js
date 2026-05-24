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

  const createMemorial = useCallback((draft) => {
    const memorial = { id: nextId(), memories: [], letters: [], events: [], ...draft };
    setMemorials((prev) => [...prev, memorial]);
    setActiveId(memorial.id);
    return memorial;
  }, []);

  const addMemory = useCallback((memorialId, memory) => {
    setMemorials((prev) =>
      prev.map((m) =>
        m.id === memorialId
          ? { ...m, memories: [{ id: nextId(), ...memory }, ...m.memories] }
          : m,
      ),
    );
  }, []);

  const addLetter = useCallback((memorialId, letter) => {
    setMemorials((prev) =>
      prev.map((m) =>
        m.id === memorialId
          ? { ...m, letters: [{ id: nextId(), ...letter }, ...m.letters] }
          : m,
      ),
    );
  }, []);

  const addEvent = useCallback((memorialId, event) => {
    setMemorials((prev) =>
      prev.map((m) =>
        m.id === memorialId
          ? { ...m, events: [...m.events, { id: nextId(), ...event }] }
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
      createMemorial,
      addMemory,
      addLetter,
      addEvent,
    }),
    [memorials, activeMemorial, selectMemorial, clearActive, createMemorial, addMemory, addLetter, addEvent],
  );

  return <MemorialContext.Provider value={value}>{children}</MemorialContext.Provider>;
}

export function useMemorials() {
  const ctx = useContext(MemorialContext);
  if (!ctx) throw new Error('useMemorials must be used within MemorialProvider');
  return ctx;
}
