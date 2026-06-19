'use client';

import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/petroom/BottomNav';
import { ConsultationScreen } from '@/components/petroom/ConsultationScreen';
import { HomeScreen } from '@/components/petroom/HomeScreen';
import { IntroScreen } from '@/components/petroom/IntroScreen';
import { ProfileScreen } from '@/components/petroom/ProfileScreen';
import { ProgressScreen } from '@/components/petroom/ProgressScreen';
import { RequestScreen } from '@/components/petroom/RequestScreen';
import type { AppScreen, RequestTarget } from '@/components/petroom/types';

const appScreens: AppScreen[] = ['home', 'request', 'progress', 'chat', 'profile'];

const readStorage = (key: string) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // Some in-app browser contexts can block localStorage. Keep the UI flow working.
  }
};

export default function PetRoomApp() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [requestTarget, setRequestTarget] = useState<RequestTarget | undefined>(undefined);

  const handleChangeScreen = (nextScreen: AppScreen) => {
    setScreen(nextScreen);
  };

  const handleStartRequest = (target?: RequestTarget) => {
    setRequestTarget(target);
    setScreen('request');
  };

  const handleStart = () => {
    writeStorage('petroom_intro_seen', 'true');
    setHasSeenIntro(true);
    setScreen('request');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedScreen = params.get('screen');
    const shouldSkipIntro = readStorage('petroom_intro_seen') === 'true' || Boolean(requestedScreen);

    setHasSeenIntro(shouldSkipIntro);

    if (requestedScreen === 'estimate') {
      setScreen('request');
      return;
    }

    if (requestedScreen === 'myQuotes') {
      setScreen('progress');
      return;
    }

    if (requestedScreen && appScreens.includes(requestedScreen as AppScreen)) {
      setScreen(requestedScreen as AppScreen);
    }
  }, []);

  if (!hasSeenIntro) {
    return <IntroScreen onStart={handleStart} />;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-background px-5 pb-24 pt-4">
      <div className="mx-auto w-full max-w-[480px]">
        {screen === 'home' && <HomeScreen onChange={handleChangeScreen} onStartRequest={handleStartRequest} />}
        {screen === 'request' && <RequestScreen initialTarget={requestTarget} onChangeScreen={handleChangeScreen} />}
        {screen === 'progress' && <ProgressScreen onChangeScreen={handleChangeScreen} />}
        {screen === 'chat' && <ConsultationScreen onChangeScreen={handleChangeScreen} />}
        {screen === 'profile' && <ProfileScreen onChangeScreen={handleChangeScreen} />}
      </div>
      <BottomNav active={screen} onChange={handleChangeScreen} />
    </main>
  );
}
