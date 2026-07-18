import type { Profile } from './supabase';

export function Avatar({
  profile,
  size = 40,
  ring = false,
}: {
  profile: Pick<Profile, 'avatar_url' | 'username'> | null;
  size?: number;
  ring?: boolean;
}) {
  const inner = (
    <div
      className="rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={profile.username}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className="font-semibold text-neutral-500 dark:text-neutral-400"
          style={{ fontSize: size * 0.4 }}
        >
          {(profile?.username ?? '?')[0]?.toUpperCase()}
        </span>
      )}
    </div>
  );

  if (ring) {
    return (
      <div className="story-ring inline-block">
        <div className="bg-white dark:bg-black rounded-full p-0.5">{inner}</div>
      </div>
    );
  }
  return inner;
}
