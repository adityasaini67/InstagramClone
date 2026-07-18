import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { Loader2 } from 'lucide-react';

export default function Signup() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
      setError('Username can only contain letters, numbers, underscores and dots.');
      return;
    }

    setLoading(true);

    // Check username uniqueness
    const { data: existing, error: checkErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (checkErr) {
      setError(checkErr.message);
      setLoading(false);
      return;
    }
    if (existing) {
      setError('That username is already taken.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create profile with chosen username (trigger already made a placeholder; upsert replaces it)
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          username,
          display_name: fullName || username,
        });
      if (profileErr) {
        setError(profileErr.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    navigate({ name: 'home' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl px-10 py-8">
          <h1 className="font-logo text-4xl text-center gradient-text mb-2">Instagram</h1>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
            Sign up to see photos and videos from your friends.
          </p>
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-neutral-600 text-gray-900 dark:text-white placeholder-gray-400"
            />
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-neutral-600 text-gray-900 dark:text-white placeholder-gray-400"
            />
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
              minLength={6}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-neutral-600 text-gray-900 dark:text-white placeholder-gray-400"
            />
            {error && <p className="text-sm text-red-500 pt-1">{error}</p>}
            <p className="text-xs text-gray-400 pt-1">
              By signing up, you agree to our Terms and Privacy Policy.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ig-primary hover:bg-ig-primary/90 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition mt-2 flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign up'}
            </button>
          </form>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl px-10 py-5 mt-3 text-center text-sm">
          <span className="text-gray-700 dark:text-gray-300">Have an account? </span>
          <button
            onClick={() => navigate({ name: 'login' })}
            className="text-ig-primary font-semibold hover:opacity-80"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}
