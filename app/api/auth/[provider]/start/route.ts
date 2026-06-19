import { NextResponse } from 'next/server';
import { createState, getProviderConfig, isOAuthProvider } from '@/lib/auth';

export async function GET(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;

  if (!isOAuthProvider(provider)) {
    return NextResponse.redirect(new URL('/?auth_error=unknown_provider', request.url));
  }

  const config = getProviderConfig(provider, request);

  if (!config.clientId) {
    return NextResponse.redirect(new URL(`/?auth_error=${provider}_missing_client_id`, request.url));
  }

  const state = createState();
  const authorizeUrl = new URL(config.authorizeUrl);
  authorizeUrl.searchParams.set('client_id', config.clientId);
  authorizeUrl.searchParams.set('redirect_uri', config.redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  if (config.scope) {
    authorizeUrl.searchParams.set('scope', config.scope);
  }
  authorizeUrl.searchParams.set('state', state);

  if (provider === 'google') {
    authorizeUrl.searchParams.set('access_type', 'offline');
    authorizeUrl.searchParams.set('prompt', 'consent');
  }

  if (provider === 'apple') {
    authorizeUrl.searchParams.set('response_mode', 'form_post');
  }

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set('petroom_oauth_state', state, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  response.cookies.set('petroom_oauth_provider', provider, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
