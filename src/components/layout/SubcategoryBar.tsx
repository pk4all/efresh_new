import React from 'react';

interface SubcategoryBarProps {
  subCategories: any[];
  activeSubcategory: string;
  onSelectSubcategory: (subName: string) => void;
}

export default function SubcategoryBar({
  subCategories,
  activeSubcategory,
  onSelectSubcategory
}: SubcategoryBarProps) {
  if (!subCategories || subCategories.length === 0) {
    return null;
  }

  return (
    <div className="w-subcategory overflow-x-auto -mx-4 px-4 mb-3">
      <div className="flex items-center gap-2 flex-nowrap select-none w-max">
        {/* "All" Tag */}
        <button
          type="button"
          onClick={() => onSelectSubcategory("")}
          className={`shrink-0 px-3.5 py-1.5 rounded-xs text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${!activeSubcategory
            ? "bg-[var(--theme-color1)] text-white font-bold shadow-2xs"
            : "bg-gray-100/90 text-gray-700 hover:bg-gray-200"
            }`}
        >
          All
        </button>

        {/* Subcategory Pills */}
        {subCategories.map((sub: any) => {
          const subName = sub.name || sub.subcat_name || "";
          const isSubActive =
            activeSubcategory.toLowerCase() === subName.toLowerCase() ||
            activeSubcategory.toLowerCase().replace(/[^a-z0-9]+/g, "-") === subName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

          return (
            <button
              key={sub.id || sub.subcategory_id}
              type="button"
              onClick={() => onSelectSubcategory(subName)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xs text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${isSubActive
                ? "bg-[var(--theme-color1)] text-white font-bold shadow-2xs"
                : "bg-gray-100/90 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {subName}
            </button>
          );
        })}
      </div>
    </div>
  );
}
