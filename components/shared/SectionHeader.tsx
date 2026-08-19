import { LucideIcon } from "lucide-react";
import React from "react";

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

// Icon badge + title/subtitle pair used to open a form section - matches
// the stat-card icon-badge pattern already used across Vouchers/Products/
// Purchase Orders elsewhere in the app.
const SectionHeader = ({ icon: Icon, title, subtitle }: SectionHeaderProps) => (
  <div className="flex items-center gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-1/10">
      <Icon className="h-4 w-4 text-primary-1" />
    </div>
    <div>
      <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  </div>
);

export default SectionHeader;
