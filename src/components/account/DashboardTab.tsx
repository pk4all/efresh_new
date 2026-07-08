"use client";

import { ShoppingBag, Clock, CheckCircle, Heart } from "lucide-react";
import { toast } from "sonner";

interface DashboardTabProps {
  profile: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  defaultAddress?: any;
  onTabChange: (tab: any) => void;
}

export default function DashboardTab({ profile, defaultAddress, onTabChange }: DashboardTabProps) {
  return (
    <div>
      {/* Title */}
      <div className="mb-6 pb-4">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight flex flex-col gap-1">
          My Dashboard
          <div className="flex gap-1.5 mt-1.5">
            <span className="w-16 h-0.5 bg-[#0da487]" />
            <span className="w-6 h-0.5 bg-[#0da487]" />
          </div>
        </h2>
      </div>

      {/* Greeting */}
      <div className="mb-6 text-sm text-gray-600 leading-relaxed">
        <p className="mb-2">Hello, <span className="font-bold text-gray-800">{profile.name}</span></p>
        <p className="text-gray-500">
          From your My Account Dashboard you have the ability to view a snapshot of your recent account activity and update your account information. Select a link below to view or edit information.
        </p>
      </div>

      {/* Dashboard Count Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Card 1: Total Order */}
        <div className="bg-white border border-gray-150 rounded-xl p-5 flex items-center justify-between relative overflow-hidden shadow-sm">
          <div className="flex items-center gap-4 z-10">
            <div className="relative w-14 h-14 bg-[#0da487]/5 text-[#0da487] flex items-center justify-center rounded-xl">
              <ShoppingBag size={28} />
              <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm text-[#0da487]">
                <Clock size={14} className="stroke-[2.5]" />
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-400 font-bold block">Total Order</span>
              <span className="text-2xl font-black text-gray-800 mt-1 block">3,658</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 text-gray-100 transform -rotate-12 select-none pointer-events-none opacity-40">
            <ShoppingBag size={80} />
          </div>
        </div>

        {/* Card 2: Total Pending Order */}
        <div className="bg-white border border-gray-150 rounded-xl p-5 flex items-center justify-between relative overflow-hidden shadow-sm">
          <div className="flex items-center gap-4 z-10">
            <div className="w-14 h-14 bg-[#0da487]/5 text-[#0da487] flex items-center justify-center rounded-xl">
              <CheckCircle size={28} />
            </div>
            <div>
              <span className="text-xs text-gray-400 font-bold block">Total Pending Order</span>
              <span className="text-2xl font-black text-gray-800 mt-1 block">254</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 text-gray-100 transform -rotate-12 select-none pointer-events-none opacity-40">
            <CheckCircle size={80} />
          </div>
        </div>

        {/* Card 3: Total Wishlist */}
        <div className="bg-white border border-gray-150 rounded-xl p-5 flex items-center justify-between relative overflow-hidden shadow-sm">
          <div className="flex items-center gap-4 z-10">
            <div className="w-14 h-14 bg-[#0da487]/5 text-[#0da487] flex items-center justify-center rounded-xl">
              <Heart size={28} />
            </div>
            <div>
              <span className="text-xs text-gray-400 font-bold block">Total Wishlist</span>
              <span className="text-2xl font-black text-gray-800 mt-1 block">32,158</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 text-gray-100 transform -rotate-12 select-none pointer-events-none opacity-40">
            <Heart size={80} />
          </div>
        </div>
      </div>

      {/* Account Details Block */}
      <div className="mt-8 border-t border-gray-100 pt-6">
        <h3 className="text-base font-black text-gray-800 uppercase tracking-wider mb-6">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h4 className="text-sm font-bold text-gray-800">Contact Information</h4>
              <button onClick={() => onTabChange("profile")} className="text-xs font-bold text-[#0da487] hover:underline cursor-pointer">Edit</button>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-bold text-gray-800 uppercase">{profile.name}</p>
              <p>{profile.email}</p>
              <button onClick={() => onTabChange("profile")} className="text-xs font-semibold text-[#0da487] hover:underline mt-2 block cursor-pointer">Change Password</button>
            </div>
          </div>

          {/* Newsletters */}
          <div className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h4 className="text-sm font-bold text-gray-800">Newsletters</h4>
              <button onClick={() => toast.info("Newsletter preferences updated!")} className="text-xs font-bold text-[#0da487] hover:underline cursor-pointer">Edit</button>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              You are currently not subscribed to any newsletter
            </p>
          </div>
        </div>
      </div>

      {/* Address Book Block */}
      <div className="mt-8 border-t border-gray-100 pt-6">
        <div className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
            <h4 className="text-sm font-bold text-gray-800">Address Book</h4>
            <button onClick={() => onTabChange("address")} className="text-xs font-bold text-[#0da487] hover:underline cursor-pointer">Edit</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h5 className="font-semibold text-gray-700 mb-1">Default Billing Address</h5>
              <p className="text-gray-500 leading-relaxed">
                {defaultAddress ? (
                  <>
                    {profile.name}<br />
                    {defaultAddress.main_address} {defaultAddress.apartment && `, ${defaultAddress.apartment}`}<br />
                    {defaultAddress.main_city}, {defaultAddress.main_state} {defaultAddress.zip_code}<br />
                    Phone: {profile.phone}
                  </>
                ) : (
                  "You have not set a default billing address."
                )}
              </p>
            </div>
            <div>
              <h5 className="font-semibold text-gray-700 mb-1">Default Shipping Address</h5>
              <p className="text-gray-500 leading-relaxed">
                {defaultAddress ? (
                  <>
                    {profile.name}<br />
                    {defaultAddress.main_address} {defaultAddress.apartment && `, ${defaultAddress.apartment}`}<br />
                    {defaultAddress.main_city}, {defaultAddress.main_state} {defaultAddress.zip_code}<br />
                    Phone: {profile.phone}
                  </>
                ) : (
                  <>
                    {profile.name}<br />
                    {profile.address}<br />
                    Phone: {profile.phone}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
