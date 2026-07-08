"use client";

export default function PrivacyTab() {
  return (
    <div>
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-xl font-black text-gray-800 tracking-tight">Privacy Settings</h2>
        <p className="text-xs text-gray-400 mt-1">Manage your security preferences and data settings.</p>
      </div>
      <div className="flex flex-col gap-4 max-w-xl">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <h4 className="text-sm font-bold text-gray-800">Two-Factor Authentication</h4>
            <p className="text-xs text-gray-400 mt-0.5">Secure your account with an extra verification step.</p>
          </div>
          <button className="px-4 py-1.5 bg-[#0da487] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
            Enable
          </button>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <h4 className="text-sm font-bold text-gray-800">Personalized Advertisements</h4>
            <p className="text-xs text-gray-400 mt-0.5">Receive relevant product offers based on your browsing.</p>
          </div>
          <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            Active
          </span>
        </div>
      </div>
    </div>
  );
}
