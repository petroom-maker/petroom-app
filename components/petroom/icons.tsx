export type LineIconName =
  | 'home'
  | 'edit'
  | 'list'
  | 'chat'
  | 'user'
  | 'bell'
  | 'pin'
  | 'wall'
  | 'floor'
  | 'door'
  | 'camera'
  | 'check'
  | 'calendar'
  | 'star'
  | 'shield'
  | 'search'
  | 'building'
  | 'headset'
  | 'document'
  | 'tiles'
  | 'brush'
  | 'clock';

export const LineIcon = ({ name, size = 30 }: { name: LineIconName; size?: number }) => {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2.4,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      {name === 'home' && (
        <>
          <path d="M5 15.5L16 6l11 9.5" {...common} />
          <path d="M9 14v12h14V14" {...common} />
          <path d="M13 26v-7h6v7" {...common} />
        </>
      )}
      {name === 'edit' && (
        <>
          <path d="M8 24.5l1.2-5L20.8 8a2 2 0 012.9 0l.3.3a2 2 0 010 2.9L12.5 22.7l-5 1.3z" {...common} />
          <path d="M19 9.5L22.5 13" {...common} />
        </>
      )}
      {name === 'list' && (
        <>
          <rect x="6" y="5" width="20" height="22" rx="4" {...common} />
          <path d="M11 12h10M11 16h10M11 20h6" {...common} />
        </>
      )}
      {name === 'chat' && (
        <>
          <rect x="4" y="6" width="24" height="16" rx="5" {...common} />
          <path d="M11 22l-2 5 6-5" {...common} />
        </>
      )}
      {name === 'user' && (
        <>
          <circle cx="16" cy="11" r="5" {...common} />
          <path d="M6 27c0-5.5 4.5-9 10-9s10 3.5 10 9" {...common} />
        </>
      )}
      {name === 'bell' && (
        <>
          <path d="M8 14a8 8 0 0116 0c0 6 2 8 2 8H6s2-2 2-8z" {...common} />
          <path d="M13 25a3 3 0 006 0" {...common} />
        </>
      )}
      {name === 'pin' && (
        <>
          <path d="M16 28s9-7.5 9-14a9 9 0 10-18 0c0 6.5 9 14 9 14z" {...common} />
          <circle cx="16" cy="14" r="3" {...common} />
        </>
      )}
      {name === 'wall' && (
        <>
          <rect x="5" y="5" width="22" height="22" rx="3" {...common} />
          <path d="M5 13h22M5 21h22" {...common} />
        </>
      )}
      {name === 'floor' && (
        <>
          <rect x="5" y="5" width="22" height="22" rx="3" {...common} />
          <path d="M12 5v22M20 5v22" {...common} />
        </>
      )}
      {name === 'door' && (
        <>
          <rect x="9" y="4" width="14" height="24" rx="2" {...common} />
          <circle cx="19" cy="16" r="1.3" fill="currentColor" stroke="none" />
        </>
      )}
      {name === 'camera' && (
        <>
          <path d="M5 11h4l2-3h10l2 3h4v14H5z" {...common} />
          <circle cx="16" cy="18" r="4.5" {...common} />
        </>
      )}
      {name === 'check' && (
        <>
          <circle cx="16" cy="16" r="11" {...common} />
          <path d="M11 16.5l3.2 3.2L21.5 12.5" {...common} />
        </>
      )}
      {name === 'calendar' && (
        <>
          <rect x="5" y="7" width="22" height="20" rx="3" {...common} />
          <path d="M5 13h22M11 4v6M21 4v6" {...common} />
        </>
      )}
      {name === 'star' && (
        <path
          d="M16 5l3.2 6.6 7.3 1-5.3 5.1 1.3 7.3L16 21.7 9.5 25l1.3-7.3-5.3-5.1 7.3-1z"
          {...common}
        />
      )}
      {name === 'shield' && (
        <>
          <path d="M16 4l9 4v6c0 7-4.5 11-9 14-4.5-3-9-7-9-14V8z" {...common} />
          <path d="M12 16l3 3 5-6" {...common} />
        </>
      )}
      {name === 'search' && (
        <>
          <circle cx="14" cy="14" r="8" {...common} />
          <path d="M20 20l6 6" {...common} />
        </>
      )}
      {name === 'building' && (
        <>
          <rect x="8" y="5" width="12" height="22" rx="2" {...common} />
          <path d="M20 12h5v15H20M12 10h4M12 15h4M12 20h4M23 17h-1M23 22h-1" {...common} />
        </>
      )}
      {name === 'headset' && (
        <>
          <path d="M7 18v-3a9 9 0 0118 0v3" {...common} />
          <rect x="4" y="17" width="5" height="7" rx="2" {...common} />
          <rect x="23" y="17" width="5" height="7" rx="2" {...common} />
          <path d="M23 24c0 2-2.5 4-7 4h-2" {...common} />
        </>
      )}
      {name === 'document' && (
        <>
          <path d="M9 4h10l5 5v19H9z" {...common} />
          <path d="M19 4v6h5M13 15h7M13 20h7M13 24h4" {...common} />
        </>
      )}
      {name === 'tiles' && (
        <>
          <rect x="6" y="6" width="8" height="8" rx="2" {...common} />
          <rect x="18" y="6" width="8" height="8" rx="2" {...common} />
          <rect x="6" y="18" width="8" height="8" rx="2" {...common} />
          <rect x="18" y="18" width="8" height="8" rx="2" {...common} />
        </>
      )}
      {name === 'brush' && (
        <>
          <path d="M20 5l7 7-9 9-7-7z" {...common} />
          <path d="M11 14l-3 3c-2 2-2 6-2 9 3 0 7 0 9-2l3-3" {...common} />
        </>
      )}
      {name === 'clock' && (
        <>
          <circle cx="16" cy="16" r="11" {...common} />
          <path d="M16 9v8l5 3" {...common} />
        </>
      )}
    </svg>
  );
};
