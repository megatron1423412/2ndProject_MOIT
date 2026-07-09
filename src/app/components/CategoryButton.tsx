import React from "react";
import { ArrowRight, Home, MonitorSmartphone, ReceiptText, Snowflake, Tv, WashingMachine } from "lucide-react";
import type { DiagnosisItem } from "../data";

interface CategoryButtonProps {
  item: DiagnosisItem;
  onSelect: (item: DiagnosisItem) => void;
}

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "air-conditioner": Snowflake,
  tv: Tv,
  refrigerator: Home,
  vacuum: WashingMachine,
  phone: MonitorSmartphone,
  internet: MonitorSmartphone,
  iptv: Tv,
  bundle: ReceiptText,
};

export default function CategoryButton({ item, onSelect }: CategoryButtonProps) {
  const Icon = iconMap[item.id] ?? ReceiptText;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group min-h-[132px] rounded-lg border border-border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md active:translate-y-0"
    >
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary transition-colors group-hover:bg-accent group-hover:text-white">
            <Icon size={21} />
          </div>
          <ArrowRight size={18} className="mt-1 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-black text-primary">{item.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
        </div>
      </div>
    </button>
  );
}
