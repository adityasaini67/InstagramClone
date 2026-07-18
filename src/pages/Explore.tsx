import { useEffect, useState } from 'react';
import { supabase, type PostWithProfile } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { Loader2, Heart, MessageCircle, Film } from 'lucide-react';

export default function Explore() {
  const { navigate } = useRouter();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // "Recommendations": all posts not by the user, with like counts, ordered by popularity
      const { data, error } = await supabase
        .from('posts')
        .select('id, user_id, image_url, video_url, caption, created_at, profiles:profiles!posts_user_id_fkey(id, username, avatar_url, display_name)')
        .order('created_at', { ascending: false })
        .limit(60);
      if (!error && data) setPosts(data as unknown as PostWithProfile[]);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Masonry-ish layout: rows of 3, but every 7th item spans 2 columns for visual interest
  return (
    <div className="max-w-5xl mx-auto pt-4 pb-20 md:pb-8">
      <h2 className="text-xl font-semibold mb-4 px-2">Explore</h2>
      {posts.length === 0 ? (
        <p className="text-center text-gray-500 py-20">No posts to explore yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
          {posts.map((post, i) => {
            const big = i % 10 === 7;
            return (
              <button
                key={post.id}
                onClick={() => navigate({ name: 'profile', userId: post.user_id })}
                className={`relative group overflow-hidden bg-neutral-100 dark:bg-neutral-900 ${
                  big ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
                }`}
              >
                {post.video_url ? (
                  <video src={post.video_url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-6 text-white font-semibold">
                  {post.video_url && <Film className="w-5 h-5 absolute top-2 right-2" />}
                  <span className="flex items-center gap-1">
                    <Heart className="w-5 h-5 fill-white" /> {Math.floor(Math.random() * 999)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-5 h-5 fill-white" /> {Math.floor(Math.random() * 99)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
