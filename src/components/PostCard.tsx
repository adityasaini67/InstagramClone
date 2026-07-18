import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { supabase, type PostWithProfile, type Comment } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import { Avatar } from '../lib/avatar';

export default function PostCard({ post }: { post: PostWithProfile }) {
  const { session, profile } = useAuth();
  const { navigate } = useRouter();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [heartAnim, setHeartAnim] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data: likes }, { count: cCount }, { data: myLike }] = await Promise.all([
        supabase.from('likes').select('id').eq('post_id', post.id),
        supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase
          .from('likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', session?.user.id ?? '')
          .maybeSingle(),
      ]);
      setLikeCount(likes?.length ?? 0);
      setCommentCount(cCount ?? 0);
      setLiked(!!myLike);
    };
    load();
  }, [post.id, session?.user.id]);

  const toggleLike = async () => {
    if (!session) return;
    if (liked) {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', session.user.id);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      await supabase.from('likes').insert({ post_id: post.id, user_id: session.user.id });
    }
  };

  const onDoubleClick = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((c) => c + 1);
      supabase.from('likes').insert({ post_id: post.id, user_id: session?.user.id });
    }
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 1000);
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('id, user_id, post_id, text, created_at, profiles:profiles!comments_user_id_fkey(id, username, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    setComments((data as unknown as Comment[]) ?? []);
  };

  const toggleComments = () => {
    if (!showComments) loadComments();
    setShowComments((s) => !s);
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session) return;
    const text = newComment.trim();
    setNewComment('');
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: post.id, user_id: session.user.id, text })
      .select('id, user_id, post_id, text, created_at')
      .single();
    if (data) {
      setComments((c) => [
        ...c,
        {
          ...data,
          profiles: {
            id: profile?.id ?? '',
            username: profile?.username ?? '',
            avatar_url: profile?.avatar_url ?? null,
          },
        },
      ]);
      setCommentCount((c) => c + 1);
    }
  };

  return (
    <article className="bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg mb-4 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate({ name: 'profile', userId: post.user_id })}>
          <Avatar profile={post.profiles} size={36} ring />
        </button>
        <button
          onClick={() => navigate({ name: 'profile', userId: post.user_id })}
          className="font-semibold text-sm hover:opacity-70"
        >
          {post.profiles.username}
        </button>
        <MoreHorizontal className="w-5 h-5 ml-auto text-gray-400" />
      </div>

      {/* Media */}
      <div className="relative select-none" onDoubleClick={onDoubleClick}>
        {post.video_url ? (
          <video
            src={post.video_url}
            controls
            loop
            playsInline
            className="w-full max-h-[600px] object-cover bg-black"
          />
        ) : (
          <img src={post.image_url} alt={post.caption ?? ''} className="w-full max-h-[600px] object-cover" />
        )}
        {heartAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="w-24 h-24 text-white fill-white animate-heart-pop" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-4">
        <button onClick={toggleLike} className="hover:opacity-60 transition">
          <Heart
            className={`w-6 h-6 ${liked ? 'fill-ig-primary text-ig-primary' : 'text-current'}`}
          />
        </button>
        <button onClick={toggleComments} className="hover:opacity-60 transition">
          <MessageCircle className="w-6 h-6" />
        </button>
        <Send className="w-6 h-6" />
        <Bookmark className="w-6 h-6 ml-auto" />
      </div>

      {/* Likes + caption */}
      <div className="px-4 pb-3">
        <p className="text-sm font-semibold mb-1">{likeCount} likes</p>
        {post.caption && (
          <p className="text-sm">
            <span className="font-semibold mr-2">{post.profiles.username}</span>
            {post.caption}
          </p>
        )}
        {commentCount > 0 && (
          <button
            onClick={toggleComments}
            className="text-sm text-gray-400 mt-1 hover:underline"
          >
            View all {commentCount} comments
          </button>
        )}

        {showComments && (
          <div className="mt-2 space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2 text-sm">
                <span className="font-semibold mr-1">{c.profiles.username}</span>
                <span className="flex-1">{c.text}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={submitComment} className="flex items-center gap-2 mt-3 border-t border-gray-100 dark:border-neutral-900 pt-3">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
          />
          {newComment.trim() && (
            <button type="submit" className="text-sm font-semibold text-ig-primary hover:opacity-70">
              Post
            </button>
          )}
        </form>
      </div>
    </article>
  );
}
