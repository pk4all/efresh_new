"use client";

import { Plus, MapPin, Edit2, Trash2 } from "lucide-react";

interface AddressTabProps {
  addresses: any[];
  profile: {
    name: string;
    phone: string;
  };
  addressFormOpen: boolean;
  editingAddressId: number | null;
  addressForm: {
    address: string;
    main_address: string;
    apartment: string;
    main_city: string;
    main_state: string;
    zip_code: string;
    country: string;
    default_ship: boolean;
  };
  setAddressForm: React.Dispatch<React.SetStateAction<any>>;
  onAddAddress: () => void;
  onEditAddress: (addr: any) => void;
  onDeleteAddress: (id: number) => void;
  onSaveAddress: (e: React.FormEvent) => void;
  onCancelForm: () => void;
}

export default function AddressTab({
  addresses,
  profile,
  addressFormOpen,
  editingAddressId,
  addressForm,
  setAddressForm,
  onAddAddress,
  onEditAddress,
  onDeleteAddress,
  onSaveAddress,
  onCancelForm,
}: AddressTabProps) {
  if (addressFormOpen) {
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-xl font-black text-gray-800 tracking-tight">
            {editingAddressId ? "Edit Address" : "Add New Address"}
          </h2>
          <p className="text-xs text-gray-400 mt-1">Provide details for your delivery address.</p>
        </div>

        <form onSubmit={onSaveAddress} className="space-y-5 max-w-2xl">
          {/* Address Label */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Address Label (e.g. Home, Work) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Home"
              value={addressForm.address}
              onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all bg-white text-gray-800"
            />
          </div>

          {/* Street Address */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Street Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="123 Main St"
              value={addressForm.main_address}
              onChange={(e) => setAddressForm({ ...addressForm, main_address: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all bg-white text-gray-800"
            />
          </div>

          {/* Apartment, Suite, etc. */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Apartment, Suite, etc. (Optional)
            </label>
            <input
              type="text"
              placeholder="Apt 4B"
              value={addressForm.apartment}
              onChange={(e) => setAddressForm({ ...addressForm, apartment: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all bg-white text-gray-800"
            />
          </div>

          {/* City & State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="New York"
                value={addressForm.main_city}
                onChange={(e) => setAddressForm({ ...addressForm, main_city: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all bg-white text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="NY"
                value={addressForm.main_state}
                onChange={(e) => setAddressForm({ ...addressForm, main_state: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all bg-white text-gray-800"
              />
            </div>
          </div>

          {/* Zip & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                ZIP / Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="10001"
                value={addressForm.zip_code}
                onChange={(e) => setAddressForm({ ...addressForm, zip_code: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all bg-white text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                value={addressForm.country || "Australia"}
                onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all bg-white text-gray-800 cursor-pointer"
              >
                <option value="Australia">Australia</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="New Zealand">New Zealand</option>
              </select>
            </div>
          </div>

          {/* Default Shipping Checkbox */}
          <div className="flex items-center gap-2.5 pt-2">
            <input
              type="checkbox"
              id="default_ship_inline"
              checked={addressForm.default_ship}
              onChange={(e) => setAddressForm({ ...addressForm, default_ship: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-[#0da487] focus:ring-[#0da487] cursor-pointer"
            />
            <label htmlFor="default_ship_inline" className="text-xs font-medium text-gray-700 cursor-pointer select-none">
              Set as default shipping address
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancelForm}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-[#0da487] hover:bg-[#0b9378] rounded-md cursor-pointer transition-colors shadow-sm"
            >
              Save Address
            </button>
          </div>
        </form>
      </div>
    );
  }

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
