"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ActiveFilter { key: string; label: string; }

export function ActiveFilterBadges({ filters, onRemove, onReset }: {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  onReset: () => void;
}) {
  if (!filters.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="فیلترهای فعال">
      {filters.map((filter) => (
        <Badge key={filter.key} variant="secondary" className="gap-1 bg-blue-50 text-blue-800 border border-blue-100">
          {filter.label}
          <button type="button" onClick={() => onRemove(filter.key)} aria-label={`حذف ${filter.label}`}>
            <X size={12} />
          </button>
        </Badge>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={onReset} className="h-7 text-xs text-gray-500">
        پاک کردن همه
      </Button>
    </div>
  );
}
