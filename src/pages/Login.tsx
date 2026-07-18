import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ name: 'home' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl px-10 py-12">
          <h1 className="font-logo text-5xl text-center gradient-text mb-8">Instagram</h1>
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-neutral-600 text-gray-900 dark:text-white placeholder-gray-400"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-neutral-600 text-gray-900 dark:text-white placeholder-gray-400"
            />
            {error && <p className="text-sm text-red-500 pt-1">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ig-primary hover:bg-ig-primary/90 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition mt-3 flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log in'}
            </button>
          </form>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl px-10 py-5 mt-3 text-center text-sm">
          <span className="text-gray-700 dark:text-gray-300">Don't have an account? </span>
          <button
            onClick={() => navigate({ name: 'signup' })}
            className="text-ig-primary font-semibold hover:opacity-80"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
