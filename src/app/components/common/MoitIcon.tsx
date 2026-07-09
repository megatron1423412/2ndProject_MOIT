import React from "react";
import {
  BadgePercent,
  Bell,
  Home,
  MonitorSmartphone,
  Network,
  Refrigerator,
  Router,
  Snowflake,
  Sparkles,
  Tv,
  WashingMachine,
} from "lucide-react";
import type { IconKey } from "../../types/moit";

interface MoitIconProps {
  name: IconKey;
  size?: number;
  className?: string;
}

const iconMap: Record<IconKey, React.ComponentType<{ size?: number; className?: string }>> = {
  sparkles: Sparkles,
  appliance: Home,
  telecom: Router,
  snowflake: Snowflake,
  tv: Tv,
  refrigerator: Refrigerator,
  vacuum: WashingMachine,
  phone: MonitorSmartphone,
  internet: Network,
  bundle: BadgePercent,
};

export default function MoitIcon({ name, size = 18, className }: MoitIconProps) {
  const Icon = iconMap[name] ?? Bell;
  return <Icon size={size} className={className} />;
}
