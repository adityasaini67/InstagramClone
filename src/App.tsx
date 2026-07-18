import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { RouterProvider, useRouter } from './lib/router';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Reels from './pages/Reels';
import ProfilePage from './pages/Profile';
import Search from './pages/Search';
import { Loader2 } from 'lucide-react';

function Shell() {
  const { session, loading } = useAuth();
  const { route } = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!session) {
    if (route.name === 'signup') return <Signup />;
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <Sidebar />
      <main className="md:ml-64">
        {route.name === 'home' && <Home />}
        {route.name === 'explore' && <Explore />}
        {route.name === 'reels' && <Reels />}
        {route.name === 'search' && <Search />}
        {route.name === 'profile' && <ProfilePage userId={route.userId} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider>
          <Shell />
        </RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
