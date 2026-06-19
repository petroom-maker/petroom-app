export function HouseMascot3D({ size = 110 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 110 110" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="55" cy="104" rx="32" ry="6" fill="rgba(18,39,74,0.18)" />
      <rect x="15" y="52" width="80" height="52" rx="6" fill="#12274A" />
      <rect x="15" y="52" width="80" height="18" rx="6" fill="#1E3A6E" />
      <path d="M15 88 Q35 78 55 88 Q75 98 95 88 V104 H15 Z" fill="#5BA7F2" opacity="0.6" />
      <path d="M15 90 Q35 82 55 90 Q75 98 95 90 V104 H15 Z" fill="#2A6DB5" opacity="0.5" />
      <path d="M15 88 Q35 82 55 88" stroke="#FFB08A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="55" cy="73" rx="14" ry="12" fill="white" opacity="0.95" />
      <circle cx="47" cy="63" r="4" fill="white" opacity="0.95" />
      <circle cx="55" cy="60" r="4.5" fill="white" opacity="0.95" />
      <circle cx="63" cy="63" r="4" fill="white" opacity="0.95" />
      <path d="M8 56 L55 16 L102 56 Z" fill="#5BA7F2" />
      <path d="M12 58 L55 20 L98 58 Z" fill="#3D8FD4" />
      <rect x="72" y="18" width="10" height="18" rx="3" fill="#1E3A6E" />
    </svg>
  );
}
