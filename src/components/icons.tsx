type IconProps = { className?: string };

const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HomeIcon({ className }: IconProps) { return <svg {...base} className={className}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" /></svg>; }
export function CalendarIcon({ className }: IconProps) { return <svg {...base} className={className}><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>; }
export function UsersIcon({ className }: IconProps) { return <svg {...base} className={className}><circle cx="9" cy="8.5" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M15.5 7a3 3 0 1 1 0 6M15 14.2a5.5 5.5 0 0 1 5.5 5.8" /></svg>; }
export function ChartIcon({ className }: IconProps) { return <svg {...base} className={className}><path d="M4 20V10M12 20V4M20 20v-6" /></svg>; }
export function CheckIcon({ className }: IconProps) { return <svg {...base} className={className}><rect x="3.5" y="4" width="17" height="16" rx="2.5" /><path d="m8 12 2.5 2.5L16.5 9" /></svg>; }
export function ProfileIcon({ className }: IconProps) { return <svg {...base} className={className}><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>; }
export function BellIcon({ className }: IconProps) { return <svg {...base} className={className}><path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>; }
export function MenuIcon({ className }: IconProps) { return <svg {...base} className={className}><path d="M4 6h16M4 12h16M4 18h16" /></svg>; }
export function PaymentIcon({ className }: IconProps) { return <svg {...base} className={className}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3 9h18M7 15h4" /></svg>; }
export function ShieldIcon({ className }: IconProps) { return <svg {...base} className={className}><path d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></svg>; }
export function TrophyIcon({ className }: IconProps) { return <svg {...base} className={className}><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" /><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 12v5M8 21h8M9 17h6" /></svg>; }
export function VideoIcon({ className }: IconProps) { return <svg {...base} className={className}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></svg>; }
export function ActivityIcon({ className }: IconProps) { return <svg {...base} className={className}><path d="M3 12h4l2-6 4 12 2-6h6" /></svg>; }
export function ClipboardIcon({ className }: IconProps) { return <svg {...base} className={className}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7" /></svg>; }
export function ChevronIcon({ className, direction = "right" }: IconProps & { direction?: "left" | "right" }) { return <svg {...base} className={className}><path d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} /></svg>; }
