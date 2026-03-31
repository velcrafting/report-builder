"use client";

import { useCallback, useMemo, useReducer } from "react";

type HistoryState<T> = {
  past: T[];
  present: T;
  future: T[];
};

type HistoryAction<T> =
  | { type: "set"; next: T }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; next: T };

export type HistoryStack<T> = {
  state: T;
  canUndo: boolean;
  canRedo: boolean;
  set: (next: T) => void;
  undo: () => void;
  redo: () => void;
  reset: (next: T) => void;
};

function historyReducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
  if (action.type === "set") {
    if (Object.is(action.next, state.present)) return state;
    return {
      past: [...state.past, state.present],
      present: action.next,
      future: [],
    };
  }

  if (action.type === "undo") {
    if (!state.past.length) return state;
    const previous = state.past[state.past.length - 1]!;
    return {
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future],
    };
  }

  if (action.type === "redo") {
    if (!state.future.length) return state;
    const [next, ...future] = state.future;
    return {
      past: [...state.past, state.present],
      present: next!,
      future,
    };
  }

  return {
    past: [],
    present: action.next,
    future: [],
  };
}

export function useHistoryStack<T>(initialState: T): HistoryStack<T> {
  const [history, dispatch] = useReducer(historyReducer<T>, {
    past: [],
    present: initialState,
    future: [],
  });

  const set = useCallback((next: T) => {
    dispatch({ type: "set", next });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "undo" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "redo" });
  }, []);

  const reset = useCallback((next: T) => {
    dispatch({ type: "reset", next });
  }, []);

  return useMemo(
    () => ({
      state: history.present,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      set,
      undo,
      redo,
      reset,
    }),
    [history.future.length, history.past.length, history.present, redo, reset, set, undo],
  );
}
