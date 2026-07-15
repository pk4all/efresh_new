"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ShoppingBag,
  Heart,
  MapPin,
  User as UserIcon,
  Shield,
  LogOut,
  ChevronRight,
  Camera
} from "lucide-react";
import { products } from "@/data/products";
import { toast } from "sonner";
import DashboardTab from "@/components/account/DashboardTab";
import OrdersTab from "@/components/account/OrdersTab";
import WishlistTab from "@/components/account/WishlistTab";
import AddressTab from "@/components/account/AddressTab";
import ProfileTab from "@/components/account/ProfileTab";
import PrivacyTab from "@/components/account/PrivacyTab";
import { handleAuthError } from "@/utils/auth";
import { fetchUserOrders } from "@/utils/api";

type TabType = "dashboard" | "orders" | "wishlist" | "address" | "profile" | "privacy";

function AccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [authChecked, setAuthChecked] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to access your account");
      router.push("/login");
    } else {
      const fetchProfile = async () => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-efresh-698528526600.australia-southeast2.run.app/api/v1/storefront";
          const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
          const res = await fetch(`${cleanBase}/profile`, {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            const profileData = data.data || data;
            setProfile({
              name: profileData.name || "User",
              email: profileData.email || "",
              phone: profileData.contact || "",
              address: profileData.suburb || "",
              gender: profileData.gender || "",
              dob: profileData.dob || "",
            });
          } else {
            const errData = await res.json().catch(() => ({}));
            handleAuthError(errData.detail);
          }
          await fetchAddresses();
        } catch (err) {
          console.error("Failed to fetch profile:", err);
        } finally {
          setAuthChecked(true);
        }
      };
      fetchProfile();
    }
  }, [router]);


  const [profile, setProfile] = useState({
    name: "Vicki E. Pope",
    email: "vicki.pope@gmail.com",
    phone: "+1 (555) 019-2834",
    address: "1418 Riverwood Drive, CA 96052, US",
    gender: "",
    dob: "",
  });

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setOrdersLoading(true);
    try {
      const data = await fetchUserOrders();
      const orderList = data.data || data || [];
      
      const mappedOrders = orderList.map((ord: any) => {
        const items = (ord.items || []).map((item: any) => ({
          product: {
            id: String(item.product_id || item.product?.id || ""),
            name: item.product_name || item.product?.name || "Unknown Product",
            image: item.product_image || item.product?.image || "/images/placeholder.jpg",
            price: parseFloat(item.product_price || item.price || item.unit_price || 0),
          },
          qty: Number(item.qty || item.quantity || 1),
          price: parseFloat(item.product_price || item.price || item.unit_price || 0),
        }));

        return {
          id: String(ord.id || ord.order_id || ord.order_number || ""),
          date: ord.created_at ? new Date(ord.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }) : ord.date || "Unknown Date",
          status: ord.status || "Pending",
          total: parseFloat(ord.amount_total || ord.total || ord.grand_total || ord.total_price || 0),
          items,
        };
      });

      setOrders(mappedOrders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    }
  }, [activeTab]);

  // Addresses State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState({
    address: "",
    main_address: "",
    apartment: "",
    main_city: "",
    main_state: "",
    zip_code: "",
    country: "Australia",
    default_ship: false,
  });

  const fetchAddresses = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-efresh-698528526600.australia-southeast2.run.app/api/v1/storefront";
      const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
      const res = await fetch(`${cleanBase}/addresses`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.data || data || []);
      } else {
        const errData = await res.json().catch(() => ({}));
        handleAuthError(errData.detail);
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    }
  };

  // Read tab from query params
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["dashboard", "orders", "wishlist", "address", "profile", "privacy"].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/account?tab=${tab}`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    setSaveLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-efresh-698528526600.australia-southeast2.run.app/api/v1/storefront";
      const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

      const response = await fetch(`${cleanBase}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          contact: profile.phone,
          suburb: profile.address,
          gender: profile.gender || null,
          dob: profile.dob || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (handleAuthError(errorData.detail)) return;
        const message = errorData.detail?.[0]?.msg || errorData.detail || "Failed to update profile";
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
      }

      const data = await response.json();
      const nameVal = data.data?.name || data.name || profile.name;
      localStorage.setItem("name", nameVal);
      
      toast.success("Profile updated successfully!");
      window.dispatchEvent(new Event("storage"));
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving profile");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      address: "",
      main_address: "",
      apartment: "",
      main_city: "",
      main_state: "",
      zip_code: "",
      country: "Australia",
      default_ship: false,
    });
    setAddressFormOpen(true);
  };

  const handleEditAddress = (addr: any) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      address: addr.address || "",
      main_address: addr.main_address || "",
      apartment: addr.apartment || "",
      main_city: addr.main_city || "",
      main_state: addr.main_state || "",
      zip_code: addr.zip_code || "",
      country: addr.country || "Australia",
      default_ship: addr.default_ship === 1,
    });
    setAddressFormOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-efresh-698528526600.australia-southeast2.run.app/api/v1/storefront";
      const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

      const payload = {
        address: addressForm.address || null,
        main_address: addressForm.main_address || null,
        apartment: addressForm.apartment || null,
        main_city: addressForm.main_city || null,
        main_state: addressForm.main_state || null,
        zip_code: addressForm.zip_code || null,
        country: addressForm.country || "Australia",
        default_ship: addressForm.default_ship ? 1 : 0,
        billing_deliveryAddress: 3,
        notes: "",
        latitude: "0",
        longitude: "0",
      };

      let response;
      if (editingAddressId) {
        response = await fetch(`${cleanBase}/addresses/${editingAddressId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${cleanBase}/addresses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (handleAuthError(errorData.detail)) return;
        const message = errorData.detail?.[0]?.msg || errorData.detail || "Failed to save address";
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
      }

      toast.success(editingAddressId ? "Address updated successfully!" : "Address added successfully!");
      setAddressFormOpen(false);
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving address");
    }
  };

  const handleDeleteAddress = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-efresh-698528526600.australia-southeast2.run.app/api/v1/storefront";
      const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

      const response = await fetch(`${cleanBase}/addresses/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (handleAuthError(errorData.detail)) return;
        const message = errorData.detail?.[0]?.msg || errorData.detail || "Failed to delete address";
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
      }

      toast.success("Address deleted successfully!");
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.message || "An error occurred while deleting address");
    }
  };

  const defaultAddress = addresses.find((addr) => addr.default_ship === 1);



  if (!authChecked) {
    return <div className="py-20 text-center text-sm text-gray-400 font-medium">Checking authentication...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 select-none">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#0da487] transition-colors">Home</Link>
        <ChevronRight size={12} />
        <span className="font-semibold text-gray-700">My Account</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column - Navigation Sidebar */}
        <div className="lg:col-span-1 bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Geometric Pattern Header */}
          <div className="h-32 w-full relative bg-[#e0f7fa]">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-100 to-blue-100 opacity-80" />
            <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon points="0,0 30,0 15,40" fill="#0da487" opacity="0.2" />
              <polygon points="30,0 60,0 45,50 15,40" fill="#0c9075" opacity="0.15" />
              <polygon points="60,0 100,0 80,60 45,50" fill="#0da487" opacity="0.2" />
              <polygon points="0,0 15,40 0,70" fill="#08705c" opacity="0.1" />
              <polygon points="15,40 45,50 30,100 0,70" fill="#0c9075" opacity="0.15" />
              <polygon points="45,50 80,60 70,100 30,100" fill="#0da487" opacity="0.1" />
              <polygon points="80,60 100,0 100,80 70,100" fill="#08705c" opacity="0.1" />
            </svg>
          </div>

          {/* Centered Avatar and Edit Button */}
          <div className="relative flex flex-col items-center -mt-12 mb-3">
            <div className="relative w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-50 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop"
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute bottom-4 right-[calc(50%-44px)] w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow hover:bg-gray-50 transition-colors cursor-pointer text-gray-500">
              <Camera size={13} />
            </button>
          </div>

          {/* User Profile Info Summary */}
          <div className="text-center pb-4 px-6 border-b border-gray-100">
            <h4 className="font-bold text-gray-800 text-lg leading-snug">{profile.name}</h4>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{profile.email}</p>
          </div>

          {/* Navigation Links (Edge-to-Edge) */}
          <ul className="flex flex-col py-2">
            {[
              { id: "dashboard", label: "DashBoard", icon: Home },
              { id: "orders", label: "Order", icon: ShoppingBag },
              { id: "wishlist", label: "Wishlist", icon: Heart },
              { id: "address", label: "Address", icon: MapPin },
              { id: "profile", label: "Profile", icon: UserIcon },
              { id: "privacy", label: "Privacy", icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => handleTabChange(tab.id as TabType)}
                    className={`w-full flex items-center gap-3.5 px-6 py-3.5 text-sm font-semibold transition-all duration-150 border-l-4 cursor-pointer ${
                      isActive
                        ? "bg-[#0da487]/10 text-[#0da487] border-[#0da487]"
                        : "text-gray-600 border-transparent hover:text-[#0da487] hover:bg-gray-50/50"
                    }`}
                  >
                    <Icon size={18} className={isActive ? "text-[#0da487]" : "text-gray-400"} />
                    <span>{tab.label}</span>
                  </button>
                </li>
              );
            })}
            <li className="mt-2 pt-2 border-t border-gray-100 px-6 pb-4">
              <button
                onClick={() => toast.success("Successfully logged out!")}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all duration-200 cursor-pointer justify-center"
              >
                <LogOut size={18} className="text-rose-500" />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Right Column - Tab Content */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-150 rounded-2xl p-6 sm:p-8 shadow-sm min-h-[500px]">
            
            {activeTab === "dashboard" && (
              <DashboardTab
                profile={profile}
                defaultAddress={defaultAddress}
                onTabChange={handleTabChange}
              />
            )}

            {activeTab === "orders" && (
              ordersLoading ? (
                <div className="py-16 text-center text-sm text-gray-400 font-bold flex flex-col items-center justify-center gap-2">
                  <span className="w-6 h-6 rounded-full border-2 border-[#0da487] border-t-transparent animate-spin" />
                  Loading your orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="font-bold text-gray-700 text-sm">No orders found</p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">You haven&apos;t placed any orders yet.</p>
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center bg-[#0da487] text-white hover:bg-[#0bc29e] font-extrabold text-xs py-2.5 px-6 rounded-xl transition-all duration-300 shadow-sm"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <OrdersTab orders={orders} />
              )
            )}

            {activeTab === "wishlist" && (
              <WishlistTab />
            )}

            {activeTab === "address" && (
              <AddressTab
                addresses={addresses}
                profile={profile}
                onAddAddress={handleAddAddress}
                onEditAddress={handleEditAddress}
                onDeleteAddress={handleDeleteAddress}
              />
            )}

            {activeTab === "profile" && (
              <ProfileTab
                profile={profile}
                setProfile={setProfile}
                onSaveProfile={handleSaveProfile}
                saveLoading={saveLoading}
              />
            )}

            {activeTab === "privacy" && (
              <PrivacyTab />
            )}

          </div>
        </div>
      </div>

      {addressFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100">
            <h3 className="text-lg font-black text-gray-800 tracking-tight mb-1">
              {editingAddressId ? "Edit Address" : "Add New Address"}
            </h3>
            <p className="text-xs text-gray-400 mb-6">Provide details for your delivery address.</p>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 uppercase tracking-wider">Address Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Home, Office"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0da487]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 uppercase tracking-wider">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1418 Riverwood Drive"
                  value={addressForm.main_address}
                  onChange={(e) => setAddressForm({ ...addressForm, main_address: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0da487]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700 uppercase tracking-wider">Apartment/Suite (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 4"
                    value={addressForm.apartment}
                    onChange={(e) => setAddressForm({ ...addressForm, apartment: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0da487]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700 uppercase tracking-wider">City/Suburb</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Redding"
                    value={addressForm.main_city}
                    onChange={(e) => setAddressForm({ ...addressForm, main_city: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0da487]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700 uppercase tracking-wider">State</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CA"
                    value={addressForm.main_state}
                    onChange={(e) => setAddressForm({ ...addressForm, main_state: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0da487]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700 uppercase tracking-wider">Zip Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 96052"
                    value={addressForm.zip_code}
                    onChange={(e) => setAddressForm({ ...addressForm, zip_code: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0da487]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="default_ship"
                  checked={addressForm.default_ship}
                  onChange={(e) => setAddressForm({ ...addressForm, default_ship: e.target.checked })}
                  className="rounded border-gray-300 text-[#0da487] focus:ring-[#0da487]"
                />
                <label htmlFor="default_ship" className="text-xs font-semibold text-gray-700 cursor-pointer select-none">
                  Set as default shipping address
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddressFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 cursor-pointer border border-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-gray-400 font-medium">Loading Account Details...</div>}>
      <AccountContent />
    </Suspense>
  );
}
