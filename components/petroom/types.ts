export type RequestTarget = 'home' | 'business';

export type AppScreen =
  | 'home'
  | 'request'
  | 'progress'
  | 'chat'
  | 'profile'
  // Legacy values used by older, currently unused screens.
  | 'estimate'
  | 'myQuotes';

export type AuthProvider = '카카오' | 'Google' | 'Apple';
