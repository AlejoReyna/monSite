export const MAX_TERMINALS = 1;

export type TerminalSessions = {
  /** Creation order. IDs are never reused while this desktop is mounted. */
  ids: number[];
  activeId: number | null;
  minimizedIds: number[];
  nextId: number;
  visible: boolean;
};

export const initialTerminalSessions: TerminalSessions = { ids: [1], activeId: 1, minimizedIds: [], nextId: 2, visible: true };

export type TerminalSessionAction =
  | { type: "new" }
  | { type: "close"; id: number }
  | { type: "focus"; id: number }
  | { type: "minimize"; id: number }
  | { type: "visible"; visible: boolean };

export function terminalSessionsReducer(state: TerminalSessions, action: TerminalSessionAction): TerminalSessions {
  switch (action.type) {
    case "new":
      if (state.ids.length >= MAX_TERMINALS) {
        const activeId = state.activeId ?? state.ids.at(-1) ?? null;
        return { ...state, activeId, minimizedIds: state.minimizedIds.filter(id => id !== activeId), visible: true };
      }
      return { ...state, ids: [...state.ids, state.nextId], activeId: state.nextId, nextId: state.nextId + 1, visible: true };
    case "close": {
      if (!state.ids.includes(action.id)) return state;
      const ids = state.ids.filter(id => id !== action.id);
      const minimizedIds = state.minimizedIds.filter(id => id !== action.id);
      const activeId = state.activeId === action.id ? ids.findLast(id => !minimizedIds.includes(id)) ?? null : state.activeId;
      return { ...state, ids, minimizedIds, activeId, visible: ids.length > 0 && state.visible };
    }
    case "focus":
      if (!state.ids.includes(action.id)) return state;
      if (state.activeId === action.id && state.visible && !state.minimizedIds.includes(action.id)) return state;
      return { ...state, activeId: action.id, minimizedIds: state.minimizedIds.filter(id => id !== action.id), visible: true };
    case "minimize": {
      if (!state.ids.includes(action.id) || state.minimizedIds.includes(action.id)) return state;
      const minimizedIds = [...state.minimizedIds, action.id];
      const activeId = state.activeId === action.id ? state.ids.findLast(id => !minimizedIds.includes(id)) ?? null : state.activeId;
      return { ...state, minimizedIds, activeId };
    }
    case "visible":
      if (action.visible && state.ids.length === 0) {
        return { ids: [state.nextId], activeId: state.nextId, minimizedIds: [], nextId: state.nextId + 1, visible: true };
      }
      return { ...state, visible: action.visible };
  }
}
