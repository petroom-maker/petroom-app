import { LineIcon, type LineIconName } from './icons';
import type { AppScreen } from './types';

const items: { key: AppScreen; label: string; icon: LineIconName }[] = [
  { key: 'home', label: '홈', icon: 'home' },
  { key: 'request', label: '요청', icon: 'edit' },
  { key: 'progress', label: '진행', icon: 'list' },
  { key: 'chat', label: '상담', icon: 'chat' },
];

export const BottomNav = ({
  active,
  onChange,
}: {
  active: AppScreen;
  onChange: (screen: AppScreen) => void;
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#E2E8F0] bg-white" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto flex max-w-[480px] px-2">
        {items.map((item) => {
          const selected = active === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-center"
            >
              <span className={selected ? 'text-[#0066FF]' : 'text-[#94A3B8]'}>
                <LineIcon name={item.icon} size={22} />
              </span>
              <span className={`text-[10px] font-bold ${selected ? 'text-[#0066FF]' : 'text-[#94A3B8]'}`}>
                {item.label}
              </span>
              <span className={`h-1 w-1 rounded-full ${selected ? 'bg-[#0066FF]' : 'bg-transparent'}`} />
            </button>
          );
        })}
      </div>
    </nav>
  );
};
