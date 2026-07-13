"use client";
import { MapPin, ChevronDown } from "lucide-react";

export default function AnnouncementBar() {
  return (
    <div
      style={{ backgroundColor: "#0da487" }}
      className="text-white text-xs py-2 hidden md:block select-none"
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Left location info */}
        <div className="flex items-center gap-1.5 font-medium opacity-90">
          <MapPin size={13} className="text-white" />
          <span>1418 Riverwood Drive, CA 96052, US</span>
        </div>

        {/* Center scrolling/welcome message */}
        <div className="font-medium text-center flex-1 max-w-xl truncate">
          Welcome to eFresh! Wrap new offers/gift every single day on Weekends. New Coupon Code: <span className="font-bold text-yellow-300">eFresh024</span>
        </div>

      </div>
    </div>
  );
}
