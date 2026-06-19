'use client';

import { useState } from 'react';
import { LineIcon } from './icons';
import type { AppScreen } from './types';

const rooms = [
  {
    id: 'petroom',
    title: 'PET ROOM 요청 확인방',
    status: '확인 중',
    preview: '요청 내용을 확인하고 있어요.',
    description: 'PET ROOM이 요청 내용을 확인 중이에요. 필요한 경우 추가 사진이나 정보를 요청드릴 수 있어요.',
    messages: ['손상 부위 전체 사진을 한 장 더 보내주시면 시공 범위를 더 정확히 확인할 수 있어요.', '이사일 또는 희망 시공일이 정해졌다면 알려주세요.'],
    actions: ['사진 추가하기', '일정 제안하기'],
  },
  {
    id: 'vendor',
    title: '업체 상담방',
    status: '대기',
    preview: '견적 도착 후 상담방이 열립니다.',
    description: '선택한 업체와 시공 일정, 최종 견적, 시공 범위, 추가비용 조건을 조율합니다.',
    messages: ['견적 도착 후 업체를 선택하면 상담방이 열립니다.', '시공 전 준비사항과 최종 금액을 이곳에서 확인할 수 있어요.'],
    actions: ['최종 견적 확인하기', '시공 확정하기'],
  },
];

export const ConsultationScreen = ({ onChangeScreen }: { onChangeScreen: (screen: AppScreen) => void }) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);

  if (selectedRoom) {
    return (
      <div className="-mx-5 -mt-4 flex min-h-[calc(100vh-96px)] flex-col bg-white">
        <header className="flex h-16 items-center gap-3 border-b border-[#E2E8F0] px-5">
          <button type="button" onClick={() => setSelectedRoomId(null)} className="text-xl font-black text-[#0F172A]">
            ←
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[17px] font-black text-[#0F172A]">{selectedRoom.title}</h1>
            <p className="text-[12px] font-bold text-[#0066FF]">{selectedRoom.status}</p>
          </div>
        </header>

        <div className="flex-1 space-y-3 bg-[#F8FAFC] px-5 py-5">
          <div className="mr-10 rounded-[18px] rounded-tl-sm bg-white px-4 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
            <p className="break-keep text-[13px] font-semibold leading-relaxed text-[#475569]">{selectedRoom.description}</p>
          </div>
          {selectedRoom.messages.map((message) => (
            <div key={message} className="mr-10 rounded-[18px] rounded-tl-sm bg-white px-4 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
              <p className="break-keep text-[14px] font-bold leading-relaxed text-[#0F172A]">{message}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-[#E2E8F0] bg-white px-5 py-4">
          {selectedRoom.actions.map((action) => (
            <button key={action} type="button" className="h-11 rounded-[14px] bg-[#EFF6FF] text-[12px] font-black text-[#0066FF]">
              {action}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-5 -mt-4 min-h-[calc(100vh-96px)] bg-white px-5 pb-6 pt-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-black text-[#0066FF]">상담</p>
          <h1 className="mt-1 text-[24px] font-black tracking-[-0.02em] text-[#0F172A]">채팅방</h1>
        </div>
        <button
          type="button"
          onClick={() => onChangeScreen('profile')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8FAFC] text-[#0F172A]"
          aria-label="마이페이지"
        >
          <LineIcon name="user" size={20} />
        </button>
      </header>

      <section className="mt-6 divide-y divide-[#E2E8F0] rounded-[20px] border border-[#E2E8F0] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
        {rooms.map((room) => (
          <button key={room.id} type="button" onClick={() => setSelectedRoomId(room.id)} className="flex w-full items-center gap-4 p-5 text-left">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#0066FF]">
              <LineIcon name={room.id === 'petroom' ? 'chat' : 'headset'} size={24} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <strong className="truncate text-[16px] font-black text-[#0F172A]">{room.title}</strong>
                <em className="shrink-0 not-italic rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-black text-[#0066FF]">{room.status}</em>
              </span>
              <span className="mt-1 block truncate text-[13px] font-semibold text-[#64748B]">{room.preview}</span>
            </span>
            <span className="text-xl font-bold text-[#CBD5E1]">›</span>
          </button>
        ))}
      </section>
    </div>
  );
};
