import { useRef, useState, useCallback } from 'react';

const MAX_HISTORY = 20;

export function useHistory() {
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const pushSnapshot = useCallback((snapshot) => {
    pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), snapshot];
    futureRef.current = [];
    updateFlags();
  }, [updateFlags]);

  const undo = useCallback((currentSnapshot) => {
    if (pastRef.current.length === 0) return null;
    const prev = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current, currentSnapshot];
    updateFlags();
    return prev;
  }, [updateFlags]);

  const redo = useCallback((currentSnapshot) => {
    if (futureRef.current.length === 0) return null;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    pastRef.current = [...pastRef.current, currentSnapshot];
    updateFlags();
    return next;
  }, [updateFlags]);

  const clear = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    updateFlags();
  }, [updateFlags]);

  return { pushSnapshot, undo, redo, clear, canUndo, canRedo };
}
