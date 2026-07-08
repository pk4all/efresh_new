import { GetCategoriesParams, GetSubCategoriesParams } from "@/types";

const getBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-efresh-698528526600.australia-southeast2.run.app/api/v1/storefront";
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

/**
 * Fetches categories from the storefront API.
 */
export async function fetchCategories(params: GetCategoriesParams = {}) {
  const cleanBase = getBaseUrl();
  const queryParams = new URLSearchParams();
  queryParams.append("limit", String(params.limit ?? 200));
  queryParams.append("offset", String(params.offset ?? 0));
  queryParams.append("vendor_id", params.vendor_id ?? "vendor_test2");

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
  queryParams.append("vendor_id", params.vendor_id ?? "vendor_test2");
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
