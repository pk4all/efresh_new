import { GetCategoriesParams, GetSubCategoriesParams } from "@/types";

const getBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-efresh-698528526600.australia-southeast2.run.app/api/v1/storefront";
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

export function getStoredVendorId(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("vendor_id") || "vendor_test3";
  }
  return "vendor_test3";
}

export async function getVendorByPincode(pincode: string) {
  const cleanBase = getBaseUrl();
  const url = `${cleanBase}/vendors/by-pincode?pincode=${encodeURIComponent(pincode)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch vendor: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetches categories from the storefront API.
 */
export async function fetchCategories(params: GetCategoriesParams = {}) {
  const cleanBase = getBaseUrl();
  const queryParams = new URLSearchParams();
  queryParams.append("limit", String(params.limit ?? 50));
  queryParams.append("offset", String(params.offset ?? 0));

  const activeVendor = params.vendor_id && params.vendor_id !== "vendor_test3"
    ? params.vendor_id
    : getStoredVendorId();
  queryParams.append("vendor_id", activeVendor);

  const url = `${cleanBase}/categories?${queryParams.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetches subcategories from the storefront API.
 */
export async function fetchSubCategories(params: GetSubCategoriesParams = {}) {
  const cleanBase = getBaseUrl();
  const queryParams = new URLSearchParams();
  queryParams.append("limit", String(params.limit ?? 50));
  queryParams.append("offset", String(params.offset ?? 0));

  const activeVendor = params.vendor_id && params.vendor_id !== "vendor_test3"
    ? params.vendor_id
    : getStoredVendorId();
  queryParams.append("vendor_id", activeVendor);

  if (params.category_id) {
    queryParams.append("category_id", params.category_id);
  }

  const url = `${cleanBase}/subcategories?${queryParams.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch subcategories: ${response.statusText}`);
  }

  return response.json();
}

export interface GetProductsParams {
  limit?: number;
  offset?: number;
  page?: number;
  vendor_id?: string;
  category_id?: string;
  search?: string;
}

/**
 * Fetches products from the storefront API.
 */
export async function fetchProducts(params: GetProductsParams = {}) {
  const cleanBase = getBaseUrl();
  const queryParams = new URLSearchParams();
  queryParams.append("limit", String(params.limit ?? 20));
  if (params.page !== undefined) {
    queryParams.append("page", String(params.page));
  } else {
    queryParams.append("offset", String(params.offset ?? 0));
  }

  const activeVendor = params.vendor_id && params.vendor_id !== "vendor_test3"
    ? params.vendor_id
    : getStoredVendorId();
  queryParams.append("vendor_id", activeVendor);

  if (params.category_id) {
    queryParams.append("category_id", params.category_id);
  }
  if (params.search) {
    queryParams.append("search", params.search);
  }

  const url = `${cleanBase}/products?${queryParams.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchProductsFromAgent(params: GetProductsParams = {}) {
  const cleanBase = getBaseUrl();
  const queryParams = new URLSearchParams();
  queryParams.append("limit", String(params.limit ?? 20));
  if (params.page !== undefined) {
    queryParams.append("page", String(params.page));
  } else {
    queryParams.append("offset", String(params.offset ?? 0));
  }

  const activeVendor = params.vendor_id && params.vendor_id !== "vendor_test3"
    ? params.vendor_id
    : getStoredVendorId();
  queryParams.append("vendor_id", activeVendor);

  if (params.category_id) {
    queryParams.append("category_id", params.category_id);
  }
  if (params.search) {
    queryParams.append("search", params.search);
  }

  const url = `${cleanBase}/products?${queryParams.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Maps storefront API product objects to the frontend Product model.
 */
export function mapApiProductToProduct(apiItem: any): any {
  const catMap: Record<string, string> = {
    "1": "Fruit",
    "2": "Vegetables",
    "3": "Nuts & Dried Fruit",
    "4": "From The Fridge",
    "5": "Continental Deli",
    "6": "Bakery",
    "7": "Groceries",
    "8": "Household",
    "9": "Flowers",
    "10": "Frozen",
    "11": "Christmas",
    "12": "Health Food",
    "13": "Party Supplies",
    "14": "Appliances",
    "15": "Pet Food",
    "16": "Outdoor",
    "17": "Medical",
    "18": "Health & Beauty",
    "19": "Baby",
    "20": "Butcher",
    "21": "Seafood",
    "22": "Café",
  };

  const cost = parseFloat(apiItem.package_cost) || 0;
  const image = apiItem.product_image && apiItem.product_image !== "NULL"
    ? apiItem.product_image
    : "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";

  return {
    id: String(apiItem.id),
    name: apiItem.product_name || apiItem.product_alt_name || "Unknown Product",
    slug: (apiItem.product_name || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + apiItem.id,
    category: apiItem.category_name || catMap[String(apiItem.cat_id)] || "Groceries",
    price: cost,
    // originalPrice: cost > 0 ? cost * 1.2 : 0,
    originalPrice: cost,
    image: image,
    rating: Number(apiItem.rating) || 4.5,
    reviewCount: Number(apiItem.reviewCount) || 12,
    badge: apiItem.organic ? "Organic" : null,
    stock: 50,
    description: apiItem.product_desc || "No description available.",
    product_name: apiItem.product_name || "",
    category_name: apiItem.category_name || "",
    subcategory_name: apiItem.subcategory_name || "",
    package_cost: apiItem.package_cost || "",
    seasonal: apiItem.seasonal || "",
    product_image: apiItem.product_image || "",
  };
}

export async function fetchUserOrders() {
  const cleanBase = getBaseUrl();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    throw new Error("No authorization token found");
  }

  const response = await fetch(`${cleanBase}/orders`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchUserProfile() {
  const cleanBase = getBaseUrl();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    throw new Error("No authorization token found");
  }

  const response = await fetch(`${cleanBase}/profile`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.statusText}`);
  }

  return response.json();
}

export async function updateUserProfile(profileData: {
  name: string;
  phone: string;
  address: string;
  gender: string | null;
  dob: string | null;
}) {
  const cleanBase = getBaseUrl();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    throw new Error("No authorization token found");
  }

  const response = await fetch(`${cleanBase}/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: profileData.name,
      contact: profileData.phone,
      suburb: profileData.address,
      gender: profileData.gender || null,
      dob: profileData.dob || null,
    }),
  });

  return response;
}

