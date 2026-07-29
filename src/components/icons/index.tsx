import React from "react";

export interface IconProps {
  className?: string;
}

export const FruitVegIcon: React.FC<IconProps> = ({ className = "w-9 h-9" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 18c0 6 4.5 9 10 9s10-3 10-9H6z" />
    <path d="M12 11c-1-3 1-6 4-6s5 3 4 6" />
    <path d="M8 14c-1-2 0-4 2-5s4 1 3 3" />
    <path d="M24 14c1-2 0-4-2-5s-4 1-3 3" />
    <line x1="6" y1="18" x2="26" y2="18" />
  </svg>
);

export const MeatSeafoodIcon: React.FC<IconProps> = ({ className = "w-9 h-9" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 6c6-2 15 2 15 10 0 7-7 11-13 11S5 22 5 15c0-4 2-7 6-9z" />
    <ellipse cx="16" cy="16" rx="4" ry="2.5" transform="rotate(-30 16 16)" />
  </svg>
);

export const GroceryBagIcon: React.FC<IconProps> = ({ className = "w-9 h-9" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 10h14l-1.5 16h-11L9 10z" />
    <path d="M12 10V7c0-2 1.5-3 4-3s4 1 4 3v3" />
    <path d="M12 13v-1M20 13v-1" />
    <path d="M13 14c1-2 3-2 3 0" />
  </svg>
);

export const ValueBoxIcon: React.FC<IconProps> = ({ className = "w-9 h-9" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4l12 6v12l-12 6L4 22V10l12-6z" />
    <line x1="16" y1="16" x2="28" y2="10" />
    <line x1="16" y1="16" x2="4" y2="10" />
    <line x1="16" y1="16" x2="16" y2="28" />
  </svg>
);

export const SpecialOffersIcon: React.FC<IconProps> = ({ className = "w-9 h-9" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4l3 3 4-1 1 4 4 1-1 4 3 3-3 3 1 4-4 1-1 4-4-1-3 3-3-3-4 1-1-4-4-1 1-4-3-3 3-3-1-4 4-1 1-4 4 1 3-3z" />
    <text x="16" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" stroke="none">$</text>
  </svg>
);

export const PetStoreIcon: React.FC<IconProps> = ({ className = "w-9 h-9" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="16" cy="21" rx="5" ry="4" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="15" cy="9" r="2" />
    <circle cx="21" cy="12" r="2" />
    <circle cx="22" cy="17" r="1.5" />
  </svg>
);

export const PlusCircleIcon: React.FC<IconProps> = ({ className = "w-9 h-9" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="16" r="10" />
    <line x1="16" y1="11" x2="16" y2="21" />
    <line x1="11" y1="16" x2="21" y2="16" />
  </svg>
);

export const MenuCircleIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="11" x2="24" y2="11" />
    <line x1="8" y1="16" x2="24" y2="16" />
    <line x1="8" y1="20" x2="24" y2="20" />
  </svg>
);

export const DairyIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 8h6v18h-6z" />
    <path d="M11 5h4v3h-4z" />
    <circle cx="22" cy="20" r="4" />
  </svg>
);

export const BakeryIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 14c0-4 4-6 10-6s10 2 10 6v8H6v-8z" />
    <line x1="10" y1="12" x2="13" y2="18" />
    <line x1="16" y1="12" x2="19" y2="18" />
  </svg>
);

export const FrozenFoodsIcon: React.FC<IconProps> = ({ className = "w-9 h-9" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16" y1="5" x2="16" y2="27" />
    <line x1="5" y1="16" x2="27" y2="16" />
    <line x1="8.2" y1="8.2" x2="23.8" y2="23.8" />
    <line x1="23.8" y1="8.2" x2="8.2" y2="23.8" />
    <path d="M13 7l3-2 3 2" />
    <path d="M13 25l3 2 3-2" />
    <path d="M7 13l-2 3 2 3" />
    <path d="M25 13l2 3-2 3" />
  </svg>
);
