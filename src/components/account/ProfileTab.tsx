"use client";

import React from "react";

interface Profile {
  name: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  dob: string;
}

interface ProfileTabProps {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  onSaveProfile: (e: React.FormEvent) => void;
  saveLoading: boolean;
}

export default function ProfileTab({
  profile,
  setProfile,
  onSaveProfile,
  saveLoading,
}: ProfileTabProps) {
  return (
    <div>
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-xl font-black text-gray-800 tracking-tight">Profile Settings</h2>
        <p className="text-xs text-gray-400 mt-1">Update your account information and contact details.</p>
      </div>

      <form onSubmit={onSaveProfile} className="max-w-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-gray-700 uppercase tracking-wider">
            Full Name
          </label>
          <input
            type="text"
            required
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0da487]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5 text-gray-700 uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            required
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0da487]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5 text-gray-700 uppercase tracking-wider">
            Phone Number
          </label>
          <input
            type="text"
            required
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0da487]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5 text-gray-700 uppercase tracking-wider">
            Primary Delivery Address
          </label>
          <input
            type="text"
            required
            value={profile.address}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0da487]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-gray-700 uppercase tracking-wider">
              Gender
            </label>
            <select
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:border-[#0da487]"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 text-gray-700 uppercase tracking-wider">
              Date of Birth
            </label>
            <input
              type="date"
              value={profile.dob}
              onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0da487]"
            />
          </div>
        </div>

        <button type="submit" disabled={saveLoading} className="btn-primary px-6 py-2.5 text-sm font-bold rounded-xl mt-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
          {saveLoading ? "Saving Changes..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
