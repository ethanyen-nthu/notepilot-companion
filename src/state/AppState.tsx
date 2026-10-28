import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';
import { decodeState, initialState, reducer, type AppState, type StateAction } from './model';
const STORAGE_KEY = '@notepilot/state/v1';
const Context = createContext<{
  state: AppState;
  dispatch: Dispatch<StateAction>;
  ready: boolean;
  storageError: string | null;
} | null>(null);
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (active) dispatch({ type: 'hydrate', state: decodeState(raw) });
      })
      .catch(() => {
        if (active)
          setStorageError('Local storage is unavailable. Changes may not survive restarting.');
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    // Serialize writes so an older save cannot overwrite a later privacy deletion.
    writes.current = writes.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)))
      .then(() => setStorageError(null))
      .catch(() =>
        setStorageError('Could not persist this change. Local data may remain on disk. Try again.'),
      );
  }, [ready, state]);
  return (
    <Context.Provider value={{ state, dispatch, ready, storageError }}>{children}</Context.Provider>
  );
}
export function useAppState() {
  const value = useContext(Context);
  if (!value) throw new Error('AppStateProvider is missing.');
  return value;
}
