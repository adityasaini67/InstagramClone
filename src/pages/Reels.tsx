import { useEffect, useRef, useState } from 'react';
import { supabase, type PostWithProfile } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import { Avatar } from '../lib/avatar';
import { Heart, MessageCircle, Send, Loader2, Volume2, VolumeX } from 'lucide-react';

export default function Reels() {
  const { session } = useAuth();
  const { navigate } = useRouter();
  const [reels, setReels] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, user_id, image_url, video_url, caption, created_at, profiles:profiles!posts_user_id_fkey(id, username, avatar_url, display_name)')
        .not('video_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(30);
      if (!error && data) setReels(data as unknown as PostWithProfile[]);
      setLoading(false);
    };
    load();
  }, []);

  // Autoplay the video in view
  useEffect(() => {
    if (!containerRef.current) return;
    const videos = Array.from(containerRef.current.querySelectorAll('video'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        });
      },
      { threshold: [0, 0.6, 1] }
    );
    videos.forEach((v) => observer.observe(v));
    return () => observer.disconnect();
  }, [reels]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg font-semibold mb-2">No reels yet</p>
        <p className="text-sm">Create a post with a video to see it here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[420px] mx-auto pb-20 md:pb-8 relative">
      <button
        onClick={() => setMuted((m) => !m)}
        className="absolute top-4 right-4 z-20 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
      >
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
      <div ref={containerRef} className="reels-snap h-[calc(100vh-3.5rem)] md:h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar">
        {reels.map((reel) => (
          <ReelItem key={reel.id} reel={reel} muted={muted} onProfileClick={() => navigate({ name: 'profile', userId: reel.user_id })} sessionUserId={session?.user.id ?? ''} />
        ))}
      </div>
    </div>
  );
}

function ReelItem({
  reel,
  muted,
  onProfileClick,
  sessionUserId,
}: {
  reel: PostWithProfile;
  muted: boolean;
  onProfileClick: () => void;
  sessionUserId: string;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { count } = await supabase
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', reel.id);
      setLikeCount(count ?? 0);
      if (sessionUserId) {
        const { data } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', reel.id)
          .eq('user_id', sessionUserId)
          .maybeSingle();
        setLiked(!!data);
      }
    };
    load();
  }, [reel.id, sessionUserId]);

  const toggleLike = async () => {
    if (!sessionUserId) return;
    if (liked) {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
      await supabase.from('likes').delete().eq('post_id', reel.id).eq('user_id', sessionUserId);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      await supabase.from('likes').insert({ post_id: reel.id, user_id: sessionUserId });
    }
  };

  return (
    <div className="relative h-[calc(100vh-3.5rem)] md:h-[calc(100vh-2rem)] flex items-center justify-center">
      <video
        src={reel.video_url ?? ''}
        loop
        muted={muted}
        playsInline
        className="w-full h-full object-cover bg-black"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Right action rail */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 text-white">
        <button onClick={toggleLike} className="flex flex-col items-center">
          <Heart className={`w-8 h-8 ${liked ? 'fill-ig-primary text-ig-primary' : ''}`} />
          <span className="text-xs mt-1">{likeCount}</span>
        </button>
        <div className="flex flex-col items-center">
          <MessageCircle className="w-8 h-8" />
          <span className="text-xs mt-1">0</span>
        </div>
        <Send className="w-8 h-8" />
      </div>

      {/* Bottom info */}
      <div className="absolute left-3 right-16 bottom-20 text-white">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={onProfileClick}>
            <Avatar profile={reel.profiles} size={32} ring />
          </button>
          <button onClick={onProfileClick} className="font-semibold text-sm hover:opacity-80">
            {reel.profiles.username}
          </button>
        </div>
        {reel.caption && <p className="text-sm line-clamp-2">{reel.caption}</p>}
      </div>
    </div>
  );
}
