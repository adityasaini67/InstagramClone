import { useEffect, useState } from 'react';
import { supabase, type PostWithProfile, type Profile } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Avatar } from '../lib/avatar';
import { Loader2, Settings, Grid3x3, Film, UserPlus, UserCheck, X } from 'lucide-react';

export default function ProfilePage({ userId }: { userId: string }) {
  const { session, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'reels'>('posts');
  const [editing, setEditing] = useState(false);

  const isOwn = session?.user.id === userId;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      setProfile(p as Profile | null);

      const { data: userPosts } = await supabase
        .from('posts')
        .select('id, user_id, image_url, video_url, caption, created_at, profiles:profiles!posts_user_id_fkey(id, username, avatar_url, display_name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setPosts((userPosts as unknown as PostWithProfile[]) ?? []);

      const { count: fCount } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('followee_id', userId);
      setFollowers(fCount ?? 0);

      const { count: gCount } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userId);
      setFollowing(gCount ?? 0);

      if (session && !isOwn) {
        const { data: rel } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', session.user.id)
          .eq('followee_id', userId)
          .maybeSingle();
        setIsFollowing(!!rel);
      }
      setLoading(false);
    };
    load();
  }, [userId, session, isOwn]);

  const toggleFollow = async () => {
    if (!session || isOwn) return;
    if (isFollowing) {
      setIsFollowing(false);
      setFollowers((c) => Math.max(0, c - 1));
      await supabase.from('follows').delete().eq('follower_id', session.user.id).eq('followee_id', userId);
    } else {
      setIsFollowing(true);
      setFollowers((c) => c + 1);
      await supabase.from('follows').insert({ follower_id: session.user.id, followee_id: userId });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!profile) {
    return <p className="text-center py-20 text-gray-500">User not found.</p>;
  }

  const reelPosts = posts.filter((p) => p.video_url);
  const gridPosts = tab === 'posts' ? posts : reelPosts;

  return (
    <div className="max-w-3xl mx-auto pt-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-start gap-6 md:gap-16 px-4 md:px-8 mb-6">
        <Avatar profile={profile} size={88} ring />
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-light">{profile.username}</h1>
            {isOwn ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-neutral-900 hover:opacity-80"
                >
                  Edit profile
                </button>
                <button onClick={() => supabase.auth.signOut()} className="p-1.5">
                  <Settings className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={toggleFollow}
                className={`text-sm font-semibold px-4 py-1.5 rounded-lg flex items-center gap-1.5 ${
                  isFollowing
                    ? 'bg-gray-100 dark:bg-neutral-900 hover:opacity-80'
                    : 'bg-ig-primary text-white hover:opacity-90'
                }`}
              >
                {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
          <div className="flex gap-8 mt-5 text-sm">
            <span><strong className="font-semibold">{posts.length}</strong> posts</span>
            <span><strong className="font-semibold">{followers}</strong> followers</span>
            <span><strong className="font-semibold">{following}</strong> following</span>
          </div>
          <div className="mt-4 text-sm">
            {profile.display_name && <p className="font-semibold">{profile.display_name}</p>}
            {profile.bio && <p className="whitespace-pre-wrap">{profile.bio}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-gray-200 dark:border-neutral-800 flex justify-center gap-12 text-xs font-semibold tracking-widest uppercase">
        <button
          onClick={() => setTab('posts')}
          className={`py-3 flex items-center gap-1.5 ${
            tab === 'posts' ? 'border-t border-current -mt-px' : 'text-gray-400'
          }`}
        >
          <Grid3x3 className="w-3.5 h-3.5" /> Posts
        </button>
        <button
          onClick={() => setTab('reels')}
          className={`py-3 flex items-center gap-1.5 ${
            tab === 'reels' ? 'border-t border-current -mt-px' : 'text-gray-400'
          }`}
        >
          <Film className="w-3.5 h-3.5" /> Reels
        </button>
      </div>

      {/* Grid */}
      {gridPosts.length === 0 ? (
        <p className="text-center text-gray-500 py-16 text-sm">
          No {tab === 'reels' ? 'reels' : 'posts'} yet.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-1 mt-1">
          {gridPosts.map((post) => (
            <div key={post.id} className="relative aspect-square bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
              {post.video_url ? (
                <video src={post.video_url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={post.image_url} alt="" className="w-full h-full object-cover" />
              )}
              {post.video_url && (
                <Film className="w-4 h-4 absolute top-2 right-2 text-white drop-shadow" />
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await refreshProfile();
          }}
        />
      )}
    </div>
  );
}

function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.display_name ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const samples = [
    'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=200',
    'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
    'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200',
    'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200',
  ];

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        display_name: displayName || null,
        bio: bio || null,
        avatar_url: avatarUrl || null,
      })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
          <h2 className="font-semibold">Edit profile</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={save} className="p-4 space-y-4">
          <div className="flex justify-center">
            <Avatar profile={{ avatar_url: avatarUrl, username }} size={72} ring />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Avatar URL</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg outline-none focus:border-ig-primary"
            />
            <div className="flex gap-2 mt-2">
              {samples.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setAvatarUrl(s)}
                  className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-neutral-800"
                >
                  <img src={s} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg outline-none focus:border-ig-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg outline-none focus:border-ig-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg outline-none focus:border-ig-primary resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-ig-primary text-white text-sm font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
}
