export type OAuthProvider = 'kakao' | 'google' | 'apple';

export type OAuthProfile = {
  id: string;
  email?: string;
  name?: string;
  provider: OAuthProvider;
};

type OAuthPayload = Record<string, unknown>;

const getString = (data: OAuthPayload, key: string) => {
  const value = data[key];
  return typeof value === 'string' ? value : undefined;
};

const getRecord = (data: OAuthPayload, key: string) => {
  const value = data[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as OAuthPayload) : {};
};

export const providerLabels: Record<OAuthProvider, '카카오' | 'Google' | 'Apple'> = {
  kakao: '카카오',
  google: 'Google',
  apple: 'Apple',
};

export const isOAuthProvider = (value: string): value is OAuthProvider =>
  value === 'kakao' || value === 'google' || value === 'apple';

export const getBaseUrl = (request: Request) =>
  process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

export const createState = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const getCookie = (request: Request, key: string) => {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${key}=`));

  return match ? decodeURIComponent(match.slice(key.length + 1)) : '';
};

export const encodeSession = (profile: OAuthProfile) =>
  Buffer.from(JSON.stringify(profile)).toString('base64url');

export const getProviderConfig = (provider: OAuthProvider, request: Request) => {
  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/${provider}/callback`;

  if (provider === 'kakao') {
    return {
      clientId: process.env.KAKAO_REST_API_KEY,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      redirectUri,
      authorizeUrl: 'https://kauth.kakao.com/oauth/authorize',
      tokenUrl: 'https://kauth.kakao.com/oauth/token',
      userUrl: 'https://kapi.kakao.com/v2/user/me',
      scope: '',
    };
  }

  if (provider === 'google') {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
      scope: 'openid email profile',
    };
  }

  return {
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
    redirectUri,
    authorizeUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    userUrl: '',
    scope: 'name email',
  };
};

export const mapProfile = (provider: OAuthProvider, data: OAuthPayload): OAuthProfile => {
  if (provider === 'kakao') {
    const account = getRecord(data, 'kakao_account');
    const profile = getRecord(account, 'profile');

    return {
      id: String(data.id),
      email: getString(account, 'email'),
      name: getString(profile, 'nickname'),
      provider,
    };
  }

  if (provider === 'google') {
    return {
      id: String(data.sub),
      email: getString(data, 'email'),
      name: getString(data, 'name'),
      provider,
    };
  }

  return {
    id: String(data.sub ?? 'apple-user'),
    email: getString(data, 'email'),
    name: getString(data, 'name'),
    provider,
  };
};
