export type Route =
  | { name: 'login' }
  | { name: 'signup' }
  | { name: 'home' }
  | { name: 'explore' }
  | { name: 'reels' }
  | { name: 'profile'; userId: string }
  | { name: 'search' };
