const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export const TapIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={1.4} aria-hidden="true">
    <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0v3.5a6 6 0 0 1-6 6h-.5a6 6 0 0 1-5-2.7L5 14.5a1.5 1.5 0 0 1 2.5-1.6L9 15" />
  </svg>
);

export const ChevronDownIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={1.5} aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
    <path d="M9.5 15l1.8 1.8 3.4-3.6" />
  </svg>
);

export const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />
  </svg>
);

export const PinIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.8" r="2.3" />
  </svg>
);

export const PhotosIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="M20.5 16l-5-5-8.5 8.5" />
  </svg>
);

export const CloseIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const PreviousIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const NextIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <path d="M9 5l7 7-7 7" />
  </svg>
);

export const SoundOnIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <path d="M11 5 6.5 9H3.5v6h3l4.5 4V5z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);

export const SoundOffIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <path d="M11 5 6.5 9H3.5v6h3l4.5 4V5z" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </svg>
);
