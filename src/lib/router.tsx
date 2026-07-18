import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Route } from './types';

type RouterContextType = {
  route: Route;
  navigate: (route: Route) => void;
};

const RouterContext = createContext<RouterContextType | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ name: 'home' });

  const navigate = (next: Route) => {
    setRoute(next);
    window.scrollTo({ top: 0 });
  };

  return (
    <RouterContext.Provider value={{ route, navigate }}>{children}</RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
