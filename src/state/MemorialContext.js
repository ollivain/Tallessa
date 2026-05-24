import { createContext, useCallback, useContext, useMemo, useState } from 'react';

let idCounter = 1;
const nextId = () => `id-${Date.now().toString(36)}-${idCounter++}`;

function seedMemorial(t) {
  return {
    id: nextId(),
    name: t('mock.memorialName'),
    birth: '1942-05-12',
    death: '2024-09-30',
    description:
      t('mock.memoryBody'),
    memories: [
      {
        id: nextId(),
        title: t('mock.memoryTitle'),
        body: t('mock.memoryBody'),
        date: '2024-08-14',
      },
    ],
    letters: [
      {
        id: nextId(),
        title: t('mock.letterTitle'),
        body: t('mock.letterBody'),
        date: '2025-02-03',
      },
    ],
    events: [
      {
        id: nextId(),
        name: t('mock.eventName'),
        date: '2026-05-12',
      },
    ],
  };
}

const MemorialContext = createContext(null);

export function MemorialProvider({ t, children }) {
  const [memorials, setMemorials] = useState(() => [seedMemorial(t)]);
  const [activeId, setActiveId] = useState(() => null);

  const activeMemorial = useMemo(
    () => memorials.find((m) => m.id === activeId) ?? null,
    [memorials, activeId],
  );

  const selectMemorial = useCallback((id) => setActiveId(id), []);
  const clearActive = useCallback(() => setActiveId(null), []);

  const createMemorial = useCallback((draft) => {
    const memorial = {
      id: nextId(),
      memories: [],
      letters: [],
      events: [],
      ...draft,
    };
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
    [
      memorials,
      activeMemorial,
      selectMemorial,
      clearActive,
      createMemorial,
      addMemory,
      addLetter,
      addEvent,
    ],
  );

  return <MemorialContext.Provider value={value}>{children}</MemorialContext.Provider>;
}

export function useMemorials() {
  const ctx = useContext(MemorialContext);
  if (!ctx) throw new Error('useMemorials must be used within MemorialProvider');
  return ctx;
}
