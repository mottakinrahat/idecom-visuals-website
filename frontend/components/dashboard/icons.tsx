"use client";

/**
 * Dashboard icon set — Iconsax (Linear), matching the design kit's icons.
 * Exposes the same names the dashboard pages already use, so pages only import from here.
 */
import type { ComponentType } from "react";
import {
  Add,
  ArrowDown as ArrowDownIcon,
  ArrowDown2,
  ArrowUp as ArrowUpIcon,
  Briefcase as BriefcaseIcon,
  Calendar as CalendarIcon,
  Call,
  Category,
  Chart,
  Clock as ClockIcon,
  Colorfilter,
  Cup,
  DollarCircle,
  HambergerMenu,
  Import,
  Layer,
  Message,
  Moon as MoonIcon,
  More,
  Notification,
  People,
  Profile,
  Profile2User,
  Refresh,
  SearchNormal1,
  Sms,
  Star1,
  Sun1,
  TickCircle,
  Trash,
  VideoPlay,
  Video as VideoIcon,
  Mobile,
  Box,
  Wallet3,
  Export,
} from "iconsax-react";

type P = { className?: string; strokeWidth?: number };
type Src = ComponentType<{ className?: string; color?: string; size?: string | number }>;

const w = (C: Src, extra = ""): ComponentType<P> =>
  function Icon({ className = "" }: P) {
    return <C className={`${className} ${extra}`.trim()} color="currentColor" size="24" />;
  };

export const LayoutDashboard = w(Category);
export const Wallet = w(Wallet3);
export const LayoutTemplate = w(Layer);
export const Contact = w(Profile2User);
export const Package = w(Box);
export const Search = w(SearchNormal1);
export const Bell = w(Notification);
export const AlignLeft = w(HambergerMenu);
export const ChevronDown = w(ArrowDown2);
export const Sun = w(Sun1);
export const Moon = w(MoonIcon);
export const X = w(Add, "rotate-45");
export const Calendar = w(CalendarIcon);
export const CalendarDays = w(CalendarIcon);
export const DollarSign = w(DollarCircle);
export const BarChart3 = w(Chart);
export const User = w(Profile);
export const ArrowUp = w(ArrowUpIcon);
export const ArrowDown = w(ArrowDownIcon);
export const Download = w(Import);
export const Upload = w(Export);
export const MoreHorizontal = w(More);
export const Video = w(VideoPlay);
export const Film = w(VideoIcon);
export const Smartphone = w(Mobile);
export const Palette = w(Colorfilter);
export const Sparkles = w(Star1);
export const Users = w(People);
export const PhoneCall = w(Call);
export const Phone = w(Call);
export const Plus = w(Add);
export const Trash2 = w(Trash);
export const RotateCcw = w(Refresh);
export const Award = w(Cup);
export const Mail = w(Sms);
export const Briefcase = w(BriefcaseIcon);
export const CheckCircle2 = w(TickCircle);
export const Clock = w(ClockIcon);
export const MessageSquare = w(Message);

/* Plain tick (the kit's check mark) */
export const Check: ComponentType<P> = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

