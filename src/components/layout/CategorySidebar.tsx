import React from 'react';
import { getPublicAssetUrl } from '@/utils/api';

export interface CategoryApiItem {
  id: number | string;
  name: string;
  image?: string;
  photo?: string;
  icon?: string;
  image_url?: string;
}

interface CategorySidebarProps {
  categories: CategoryApiItem[];
  selectedCategoryName?: string;
  onSelectCategory: (cat: CategoryApiItem) => void;
}

function getCategoryThumbnail(c: any): string {
  const raw = c?.image || c?.photo || c?.icon || c?.image_url;
  if (raw) {
    return getPublicAssetUrl(raw);
  }
  return getPublicAssetUrl("/images/placeholder.png");
}

export default function CategorySidebar({ categories, selectedCategoryName, onSelectCategory }: CategorySidebarProps) {
  return (
    <aside className="w-[90px] sm:w-[115px] md:w-[130px] flex-shrink-0 sticky max-h-[calc(100vh-100px)] overflow-y-auto category-sidebar-scrollbar bg-white border-r border-gray-200 pr-1.5 pt-1.5 pb-2 space-y-1.5 self-start select-none">
      {categories.map((cat) => {
        const isCatSelected = selectedCategoryName?.toLowerCase() === cat.name.toLowerCase();

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`w-full py-1.5 px-1 flex flex-col items-center justify-center text-center relative group transition-all cursor-pointer rounded-xl ${isCatSelected ? "bg-emerald-50/80 text-gray-900" : "hover:bg-gray-50 text-gray-600"
              }`}
          >
            {/* Active Vertical Green Indicator Bar on Left Side */}
            {isCatSelected && (
              <div className="absolute left-0 top-1 bottom-1 w-1 bg-[var(--theme-color1)] rounded-r-full" />
            )}

            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center p-1.5 mb-1 transition-all overflow-hidden border ${isCatSelected ? "bg-white border-emerald-300 shadow-2xs scale-105" : "bg-gray-50 border-gray-100 group-hover:border-gray-200"
              }`}>
              <img
                src={getCategoryThumbnail(cat)}
                alt={cat.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getPublicAssetUrl("/images/placeholder.png");
                }}
              />
            </div>

            <span className={`text-[11px] leading-tight px-0.5 line-clamp-2 ${isCatSelected ? "font-extrabold text-gray-900" : "font-medium text-gray-600"
              }`}>
              {cat.name}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
