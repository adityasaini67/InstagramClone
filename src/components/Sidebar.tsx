import { Home, Compass, Film, Search, User as UserIcon, Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import { Avatar } from '../lib/avatar';
import type { Route } from '../lib/types';

export default function Sidebar() {
  const { theme, toggle } = useTheme();
  const { profile, signOut } = useAuth();
  const { route, navigate } = useRouter();

  const items: { label: string; icon: typeof Home; route: Route; active: boolean }[] = [
    { label: 'Home', icon: Home, route: { name: 'home' }, active: route.name === 'home' },
    { label: 'Search', icon: Search, route: { name: 'search' }, active: route.name === 'search' },
    { label: 'Explore', icon: Compass, route: { name: 'explore' }, active: route.name === 'explore' },
    { label: 'Reels', icon: Film, route: { name: 'reels' }, active: route.name === 'reels' },
    {
      label: 'Profile',
      icon: UserIcon,
      route: { name: 'profile', userId: profile?.id ?? '' },
      active: route.name === 'profile',
    },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 border-r border-gray-200 dark:border-neutral-800 bg-white dark:bg-black px-4 py-6 z-30">
        <h1 className="font-logo text-3xl gradient-text px-2 mb-8 mt-2">Instagram</h1>
        <nav className="flex flex-col gap-1 flex-1">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.route)}
              className={`flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition ${
                item.active ? 'font-semibold' : 'font-normal'
              }`}
            >
              <item.icon className="w-6 h-6" strokeWidth={item.active ? 2.5 : 1.8} />
              <span className="text-base">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="flex flex-col gap-1">
          <button
            onClick={toggle}
            className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition"
          >
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            <span className="text-base">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-base">Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-black flex items-center justify-around z-30">
        {items.map((item) => (
          <button key={item.label} onClick={() => navigate(item.route)} className="p-2">
            <item.icon
              className="w-6 h-6"
              strokeWidth={item.active ? 2.5 : 1.8}
              color={item.active ? '#E1306C' : 'currentColor'}
            />
          </button>
        ))}
      </nav>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-black">
        <h1 className="font-logo text-2xl gradient-text">Instagram</h1>
        <div className="flex items-center gap-3">
          <button onClick={toggle} className="p-1">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => navigate({ name: 'profile', userId: profile?.id ?? '' })}>
            <Avatar profile={profile} size={28} />
          </button>
        </div>
      </header>
    </>
  );
}
