"use client";

import Link from "next/link";
import { ChevronLeft, Home } from "lucide-react";
import { BreadcrumbItemData } from "@/data/motorCategories";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface CategoryBreadcrumbProps {
  breadcrumbs: BreadcrumbItemData[];
}

export function CategoryBreadcrumb({ breadcrumbs }: CategoryBreadcrumbProps) {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return (
    <nav className="bg-gray-50/80 border-y border-gray-200/80 py-2.5" aria-label="موقعیت در سایت">
      <div className="max-w-7xl mx-auto px-4">
        <Breadcrumb>
          <BreadcrumbList className="text-xs sm:text-sm text-gray-500 flex-row gap-1 sm:gap-2">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              const isFirst = idx === 0;

              return (
                <div key={crumb.href + idx} className="inline-flex items-center gap-1 sm:gap-2">
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-semibold text-blue-900">
                        {crumb.title}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link
                          href={crumb.href}
                          className="hover:text-blue-700 transition-colors inline-flex items-center gap-1"
                        >
                          {isFirst && <Home size={13} className="shrink-0 mb-0.5" />}
                          <span>{crumb.title}</span>
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && (
                    <BreadcrumbSeparator className="text-gray-400">
                      <ChevronLeft size={13} />
                    </BreadcrumbSeparator>
                  )}
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </nav>
  );
}
