import { NextResponse } from 'next/server';
import {
  encodeSession,
  getCookie,
  getProviderConfig,
  isOAuthProvider,
  mapProfile,
  providerLabels,
  type OAuthProvider,
} from '@/lib/auth';

const decodeJwtPayload = (token: string) => {
  const [, payload] = token.split('.');
  if (!payload) {
    return {};
  }

  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>;
};

const exchangeToken = async (provider: OAuthProvider, request: Request, code: string) => {
  const config = getProviderConfig(provider, request);

  if (!config.clientId || !config.clientSecret) {
    throw new Error(`${provider}_missing_config`);
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code,
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  const result = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(String(result.error_description || result.error || `${provider}_token_error`));
  }

  return result;
};

const fetchProfile = async (provider: OAuthProvider, request: Request, code: string) => {
  const token = await exchangeToken(provider, request, code);
  const config = getProviderConfig(provider, request);

  if (provider === 'apple') {
    return mapProfile(provider, decodeJwtPayload(String(token.id_token ?? '')));
  }

  const response = await fetch(config.userUrl, {
    headers: { authorization: `Bearer ${String(token.access_token ?? '')}` },
  });
  const result = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(String(result.error_description || result.error || `${provider}_profile_error`));
  }

  return mapProfile(provider, result);
};

const handleCallback = async (request: Request, provider: string, formData?: FormData) => {
  if (!isOAuthProvider(provider)) {
    return NextResponse.redirect(new URL('/?auth_error=unknown_provider', request.url));
  }

  const url = new URL(request.url);
  const code = String(formData?.get('code') ?? url.searchParams.get('code') ?? '');
  const state = String(formData?.get('state') ?? url.searchParams.get('state') ?? '');
  const expectedState = getCookie(request, 'petroom_oauth_state');

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL('/?auth_error=invalid_state', request.url));
  }

  try {
    const profile = await fetchProfile(provider, request, code);
    const label = providerLabels[provider];
    const redirectUrl = new URL(`/?auth=${provider}&oauth=success`, request.url);
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set('petroom_auth_session', encodeSession(profile), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    response.cookies.set('petroom_auth_provider_label', encodeURIComponent(label), {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    response.cookies.delete('petroom_oauth_state');
    response.cookies.delete('petroom_oauth_provider');

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : `${provider}_callback_error`;
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(message)}`, request.url));
  }
};

export async function GET(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  return handleCallback(request, provider);
}

export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const formData = await request.formData();
  return handleCallback(request, provider, formData);
}
