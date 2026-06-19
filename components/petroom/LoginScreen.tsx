import Link from 'next/link';
import type { AuthProvider } from './types';

const loginButtons: { provider: AuthProvider; label: string; href: string; className: string }[] = [
  {
    provider: '카카오',
    label: '카카오로 시작하기',
    href: '/api/auth/kakao/start',
    className: 'bg-[#FEE500] text-[#181600]',
  },
  {
    provider: 'Google',
    label: 'Google로 계속하기',
    href: '/api/auth/google/start',
    className: 'border border-slate-200 bg-white text-navy',
  },
  {
    provider: 'Apple',
    label: 'Apple로 계속하기',
    href: '/api/auth/apple/start',
    className: 'border border-slate-200 bg-white text-navy',
  },
];

export const LoginScreen = ({ authError }: { authError: string }) => {
  return (
    <main className="flex min-h-screen items-center bg-white px-6 py-10">
      <div className="mx-auto w-full max-w-[400px]">
        <img src="/petroom-logo-transparent.png" alt="새집다오" className="mb-6 h-16 w-16 object-contain" />

        <h1 className="mb-3 text-3xl font-extrabold leading-tight text-navy">
          반려가구
          <br />
          주거관리
        </h1>
        <p className="mb-10 text-sm leading-relaxed text-slate-400">복구 견적부터 시공까지, 한 곳에서.</p>

        {authError && (
          <p className="mb-4 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-xs font-bold leading-relaxed text-warn">
            로그인 설정이 아직 필요합니다. 환경변수와 콘솔 Redirect URI를 확인해주세요.
          </p>
        )}

        <div className="space-y-3">
          {loginButtons.map((item) => (
            <Link
              key={item.provider}
              href={item.href}
              className={`flex h-14 items-center justify-center rounded-2xl text-sm font-extrabold ${item.className}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
};
