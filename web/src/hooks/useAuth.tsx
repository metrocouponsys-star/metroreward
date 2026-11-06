import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, StampError } from '../lib/api.ts';

interface User {
  phone: string;
  role: 'customer' | 'shop' | 'admin';
  customerId?: string;
  shopId?: string;
  name: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    try {
      const data = await api.get<User>('/me');
      setUser(data);
    } catch (err) {
      if (err instanceof StampError && err.code === 'NOT_AUTHENTICATED') {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
  }

  useEffect(() => { fetchMe(); }, []);

  return (
    <Ctx.Provider value={{ user, loading, refresh: fetchMe, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}

