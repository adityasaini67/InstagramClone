import { useEffect, useState } from 'react';
import { supabase, type PostWithProfile, type Profile } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import PostCard from '../components/PostCard';
import { Avatar } from '../lib/avatar';
import { Plus, Loader2, X } from 'lucide-react';

export default function Home() {
  const { session, profile } = useAuth();
  const { navigate } = useRouter();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setFollowingIds] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!session) return;
      // Get following
      const { data: follows } = await supabase
        .from('follows')
        .select('followee_id')
        .eq('follower_id', session.user.id);
      const ids = (follows ?? []).map((f) => f.followee_id);
      ids.push(session.user.id); // include self
      setFollowingIds(ids);

      const { data, error } = await supabase
        .from('posts')
        .select('id, user_id, image_url, video_url, caption, created_at, profiles:profiles!posts_user_id_fkey(id, username, avatar_url, display_name)')
        .in('user_id', ids)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) setPosts(data as unknown as PostWithProfile[]);
      setLoading(false);
    };
    load();
  }, [session]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-[470px] mx-auto pt-4 pb-20 md:pb-8">
      {/* Stories */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 mb-2">
        <StoryBubble profile={profile} label="Your story" isSelf onClick={() => setShowCreate(true)} />
        {posts
          .filter((p) => p.user_id !== session?.user.id)
          .reduce((acc, p) => {
            if (!acc.find((x) => x.user_id === p.user_id)) acc.push(p);
            return acc;
          }, [] as PostWithProfile[])
          .slice(0, 10)
          .map((p) => (
            <StoryBubble
              key={p.user_id}
              profile={p.profiles}
              label={p.profiles.username}
              onClick={() => navigate({ name: 'profile', userId: p.user_id })}
            />
          ))}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg font-semibold mb-2">No posts yet</p>
          <p className="text-sm">Follow people or create your first post.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 bg-ig-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90"
          >
            Create post
          </button>
        </div>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      )}

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function StoryBubble({
  profile,
  label,
  isSelf,
  onClick,
}: {
  profile: Pick<Profile, 'id' | 'username' | 'avatar_url'> | null;
  label: string;
  isSelf?: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 shrink-0">
      <div className="relative">
        <Avatar profile={profile} size={62} ring={!isSelf} />
        {isSelf && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-ig-primary rounded-full p-0.5 border-2 border-white dark:border-black">
            <Plus className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      <span className="text-xs max-w-[64px] truncate">{label}</span>
    </button>
  );
}

function CreatePostModal({ onClose }: { onClose: () => void }) {
  const { session, refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleImages = [
    'https://images.pexels.com/photos/459225/pexels-photo-459225.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/349758/pexels-photo-349758.jpeg?auto=compress&cs=tinysrgb&w=800',
  ];
  const sampleVideos = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl && !videoUrl) {
      setError('Provide an image URL or pick a sample.');
      return;
    }
    setSubmitting(true);
    const { error: insErr } = await supabase.from('posts').insert({
      user_id: session?.user.id,
      image_url: imageUrl || sampleImages[0],
      video_url: videoUrl || null,
      caption: caption || null,
    });
    setSubmitting(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    await refreshProfile();
    onClose();
    navigate({ name: 'home' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-neutral-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
          <h2 className="font-semibold">Create new post</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">Image URL</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg outline-none focus:border-ig-primary"
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              {sampleImages.map((u) => (
                <button
                  type="button"
                  key={u}
                  onClick={() => setImageUrl(u)}
                  className="w-14 h-14 rounded overflow-hidden border border-gray-200 dark:border-neutral-800 hover:opacity-80"
                >
                  <img src={u} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Video URL (optional, makes it a reel)</label>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg outline-none focus:border-ig-primary"
            />
            <div className="flex gap-2 mt-2">
              {sampleVideos.map((u) => (
                <button
                  type="button"
                  key={u}
                  onClick={() => setVideoUrl(u)}
                  className="text-xs px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  Sample {sampleVideos.indexOf(u) + 1}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              placeholder="Write a caption..."
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg outline-none focus:border-ig-primary resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-ig-primary text-white text-sm font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Share'}
          </button>
        </form>
      </div>
    </div>
  );
}
