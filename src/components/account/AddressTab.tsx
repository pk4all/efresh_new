"use client";

import { Plus, MapPin, Edit2, Trash2 } from "lucide-react";

interface AddressTabProps {
  addresses: any[];
  profile: {
    name: string;
    phone: string;
  };
  onAddAddress: () => void;
  onEditAddress: (addr: any) => void;
  onDeleteAddress: (id: number) => void;
}

export default function AddressTab({
  addresses,
  profile,
  onAddAddress,
  onEditAddress,
  onDeleteAddress,
}: AddressTabProps) {
  return (
    <div>
      <div className="mb-6 border-b border-gray-100 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Saved Addresses</h2>
          <p className="text-xs text-gray-400 mt-1">Manage your delivery and billing addresses.</p>
        </div>
        <button
          onClick={onAddAddress}
          className="btn-primary py-2 px-3 text-xs font-bold gap-1 rounded-xl shadow-md cursor-pointer"
        >
          <Plus size={14} /> Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-gray-400">
          <MapPin size={40} className="mx-auto mb-3 text-gray-300 animate-pulse" />
          <p className="text-sm font-semibold text-gray-700">No saved addresses found</p>
          <p className="text-xs mt-1 text-gray-400">You haven't added any delivery addresses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="border border-gray-150 rounded-2xl p-5 relative shadow-sm hover:border-[#0da487]/30 transition-all bg-white">
              {addr.default_ship === 1 && (
                <span className="absolute top-4 right-4 text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                  Default
                </span>
              )}
              
              <span className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1">{addr.address || "Address"}</span>
              <h4 className="font-bold text-gray-800 text-sm leading-normal">{profile.name}</h4>
              <p className="text-xs text-gray-500 leading-relaxed mt-2">
                {addr.main_address} {addr.apartment && `, ${addr.apartment}`} <br />
                {addr.main_city}, {addr.main_state} {addr.zip_code}
              </p>
              <p className="text-xs text-gray-400 font-semibold mt-2">{profile.phone}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  onClick={() => onEditAddress(addr)}
                  className="text-xs font-bold text-gray-500 hover:text-[#0da487] flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 size={12} /> Edit
                </button>
                {addr.default_ship !== 1 && (
                  <button
                    onClick={() => onDeleteAddress(addr.id)}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
