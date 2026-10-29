import { createContext, useContext, useState, type ReactNode } from 'react';
import type { GatewaySession } from '../providers/vision';
const Context = createContext<{
  session: GatewaySession | null;
  connect: (value: GatewaySession | null) => void;
}>({ session: null, connect: () => {} });
// Gateway access token is a personal development credential, not an OpenAI key.
// Memory only: never persisted in AsyncStorage or compiled into the bundle.
export function GatewaySessionProvider({ children }: { children: ReactNode }) {
  const [session, connect] = useState<GatewaySession | null>(null);
  return <Context.Provider value={{ session, connect }}>{children}</Context.Provider>;
}
export const useGatewaySession = () => useContext(Context);
