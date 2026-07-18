import { useEffect, useState } from 'react';
import { supabase, type Profile } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { Avatar } from '../lib/avatar';
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';

export default function Search() {
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<Profile[]>([]);

  useEffect(() => {
    // Load some recent users as suggestions
    const loadRecent = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
      setRecent((data as Profile[]) ?? []);
    };
    loadRecent();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query.trim()}%,display_name.ilike.%${query.trim()}%`)
        .limit(20);
      setResults((data as Profile[]) ?? []);
      setLoading(false);
    };
    const t = setTimeout(run, 250);
    return () => clearTimeout(t);
  }, [query]);

  const list = query.trim() ? results : recent;

  return (
    <div className="max-w-md mx-auto pt-4 pb-20 md:pb-8 px-4">
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          placeholder="Search users by username or name"
          className="w-full pl-9 pr-9 py-2.5 text-sm bg-gray-100 dark:bg-neutral-900 border border-transparent focus:border-gray-300 dark:focus:border-neutral-700 rounded-lg outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-current"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!query.trim() && (
        <h2 className="text-sm font-semibold text-gray-500 mb-2">Suggested</h2>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : list.length === 0 ? (
        <p className="text-center text-gray-500 py-10 text-sm">No users found.</p>
      ) : (
        <div className="space-y-1">
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate({ name: 'profile', userId: p.id })}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 text-left"
            >
              <Avatar profile={p} size={44} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{p.username}</p>
                {p.display_name && (
                  <p className="text-xs text-gray-500 truncate">{p.display_name}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
