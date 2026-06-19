import { CalendarDays, Code2, LayoutDashboard, StickyNote, Target, Wallet } from "lucide-react";
import type { ViewKey } from "./types";

export const navItems: Array<{ key: ViewKey; icon: typeof LayoutDashboard }> = [
  { key: "dashboard", icon: LayoutDashboard },
  { key: "goals", icon: Target },
  { key: "calendar", icon: CalendarDays },
  { key: "notes", icon: StickyNote },
  { key: "finance", icon: Wallet },
  { key: "code", icon: Code2 },
];
