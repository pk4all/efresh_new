# 🛒 Fastkart E-Commerce — API Reference

> All REST API endpoints for the Fastkart Next.js 16 e-commerce application.
> Base URL: `https://your-domain.com/api`

---

## 📦 Products

| # | Name | Method | URL |
|---|------|--------|-----|
| 1 | Get All Products | `GET` | `/api/products` |
| 2 | Get Product by Slug | `GET` | `/api/products/:slug` |
| 3 | Get Product by ID | `GET` | `/api/products/:id` |
| 4 | Get Featured Products | `GET` | `/api/products/featured` |
| 5 | Get Best Sellers | `GET` | `/api/products/best-sellers` |
| 6 | Get New Arrivals | `GET` | `/api/products/new-arrivals` |
| 7 | Get Today's Deals | `GET` | `/api/products/deals` |
| 8 | Search Products | `GET` | `/api/products/search?q={query}` |
| 9 | Filter Products | `GET` | `/api/products?category=&minPrice=&maxPrice=&rating=&brand=&sort=` |
| 10 | Create Product (Admin) | `POST` | `/api/products` |
| 11 | Update Product (Admin) | `PUT` | `/api/products/:id` |
| 12 | Delete Product (Admin) | `DELETE` | `/api/products/:id` |

---

## 🗂️ Categories

| # | Name | Method | URL |
|---|------|--------|-----|
| 13 | Get All Categories | `GET` | `/api/categories` |
| 14 | Get Category by Slug | `GET` | `/api/categories/:slug` |
| 15 | Get Products by Category | `GET` | `/api/categories/:slug/products` |
| 16 | Get Sub-Categories | `GET` | `/api/categories/:slug/subcategories` |
| 17 | Create Category (Admin) | `POST` | `/api/categories` |
| 18 | Update Category (Admin) | `PUT` | `/api/categories/:id` |
| 19 | Delete Category (Admin) | `DELETE` | `/api/categories/:id` |

---

## 👤 Auth / User

| # | Name | Method | URL |
|---|------|--------|-----|
| 20 | Register User | `POST` | `/api/auth/register` |
| 21 | Login User | `POST` | `/api/auth/login` |
| 22 | Logout User | `POST` | `/api/auth/logout` |
| 23 | Refresh Token | `POST` | `/api/auth/refresh` |
| 24 | Forgot Password | `POST` | `/api/auth/forgot-password` |
| 25 | Reset Password | `POST` | `/api/auth/reset-password` |
| 26 | Verify Email | `GET` | `/api/auth/verify-email?token={token}` |
| 27 | Get Current User | `GET` | `/api/auth/me` |
| 28 | Update Profile | `PUT` | `/api/auth/me` |
| 29 | Change Password | `PUT` | `/api/auth/me/password` |
| 30 | Delete Account | `DELETE` | `/api/auth/me` |
| 31 | Google OAuth Login | `GET` | `/api/auth/google` |
| 32 | Google OAuth Callback | `GET` | `/api/auth/google/callback` |

---

## 🛒 Cart

| # | Name | Method | URL |
|---|------|--------|-----|
| 33 | Get Cart | `GET` | `/api/cart` |
| 34 | Add Item to Cart | `POST` | `/api/cart/items` |
| 35 | Update Cart Item Quantity | `PUT` | `/api/cart/items/:itemId` |
| 36 | Remove Item from Cart | `DELETE` | `/api/cart/items/:itemId` |
| 37 | Clear Cart | `DELETE` | `/api/cart` |
| 38 | Apply Coupon to Cart | `POST` | `/api/cart/coupon` |
| 39 | Remove Coupon from Cart | `DELETE` | `/api/cart/coupon` |

---

## ❤️ Wishlist

| # | Name | Method | URL |
|---|------|--------|-----|
| 40 | Get Wishlist | `GET` | `/api/wishlist` |
| 41 | Add Product to Wishlist | `POST` | `/api/wishlist` |
| 42 | Remove Product from Wishlist | `DELETE` | `/api/wishlist/:productId` |
| 43 | Clear Wishlist | `DELETE` | `/api/wishlist` |
| 44 | Move Wishlist Item to Cart | `POST` | `/api/wishlist/:productId/move-to-cart` |

---

## 📋 Orders

| # | Name | Method | URL |
|---|------|--------|-----|
| 45 | Place Order | `POST` | `/api/orders` |
| 46 | Get My Orders | `GET` | `/api/orders` |
| 47 | Get Order by ID | `GET` | `/api/orders/:id` |
| 48 | Cancel Order | `PUT` | `/api/orders/:id/cancel` |
| 49 | Track Order | `GET` | `/api/orders/:id/track` |
| 50 | Get All Orders (Admin) | `GET` | `/api/admin/orders` |
| 51 | Update Order Status (Admin) | `PUT` | `/api/admin/orders/:id/status` |

---

## 💳 Checkout & Payments

| # | Name | Method | URL |
|---|------|--------|-----|
| 52 | Calculate Shipping | `POST` | `/api/checkout/shipping` |
| 53 | Calculate Order Total | `POST` | `/api/checkout/total` |
| 54 | Create Payment Intent (Stripe) | `POST` | `/api/payments/create-intent` |
| 55 | Confirm Payment | `POST` | `/api/payments/confirm` |
| 56 | Payment Webhook | `POST` | `/api/payments/webhook` |
| 57 | Get Payment Methods | `GET` | `/api/payments/methods` |
| 58 | Initiate UPI Payment | `POST` | `/api/payments/upi` |
| 59 | Cash on Delivery | `POST` | `/api/payments/cod` |

---

## 📍 Addresses

| # | Name | Method | URL |
|---|------|--------|-----|
| 60 | Get User Addresses | `GET` | `/api/addresses` |
| 61 | Add New Address | `POST` | `/api/addresses` |
| 62 | Update Address | `PUT` | `/api/addresses/:id` |
| 63 | Delete Address | `DELETE` | `/api/addresses/:id` |
| 64 | Set Default Address | `PUT` | `/api/addresses/:id/default` |

---

## ⭐ Reviews & Ratings

| # | Name | Method | URL |
|---|------|--------|-----|
| 65 | Get Product Reviews | `GET` | `/api/products/:id/reviews` |
| 66 | Add Product Review | `POST` | `/api/products/:id/reviews` |
| 67 | Update Review | `PUT` | `/api/reviews/:id` |
| 68 | Delete Review | `DELETE` | `/api/reviews/:id` |
| 69 | Mark Review Helpful | `POST` | `/api/reviews/:id/helpful` |

---

## 🎟️ Coupons

| # | Name | Method | URL |
|---|------|--------|-----|
| 70 | Validate Coupon | `POST` | `/api/coupons/validate` |
| 71 | Get All Coupons (Admin) | `GET` | `/api/admin/coupons` |
| 72 | Create Coupon (Admin) | `POST` | `/api/admin/coupons` |
| 73 | Update Coupon (Admin) | `PUT` | `/api/admin/coupons/:id` |
| 74 | Delete Coupon (Admin) | `DELETE` | `/api/admin/coupons/:id` |


---

## 📍 Location

| # | Name | Method | URL |
|---|------|--------|-----|
| 81 | Get Delivery Locations | `GET` | `/api/locations` |
| 82 | Check Delivery Availability | `POST` | `/api/locations/check` |
| 83 | Get Delivery Slots | `GET` | `/api/locations/slots?pincode={pincode}` |
| 84 | Get Countries | `GET` | `/api/locations/countries` |
| 85 | Get States by Country | `GET` | `/api/locations/countries/:code/states` |
| 86 | Get Cities by State | `GET` | `/api/locations/states/:code/cities` |

---

## 🖼️ Banners & CMS

| # | Name | Method | URL |
|---|------|--------|-----|
| 87 | Get Hero Banners | `GET` | `/api/banners/hero` |
| 88 | Get Promo Banners | `GET` | `/api/banners/promo` |
| 89 | Get All Banners (Admin) | `GET` | `/api/admin/banners` |
| 90 | Create Banner (Admin) | `POST` | `/api/admin/banners` |
| 91 | Update Banner (Admin) | `PUT` | `/api/admin/banners/:id` |
| 92 | Delete Banner (Admin) | `DELETE` | `/api/admin/banners/:id` |


---

## 🔍 Search & Suggestions

| # | Name | Method | URL |
|---|------|--------|-----|
| 100 | Global Search | `GET` | `/api/search?q={query}` |
| 101 | Search Suggestions / Autocomplete | `GET` | `/api/search/suggestions?q={query}` |
| 102 | Trending Searches | `GET` | `/api/search/trending` |

---


---

## 📝 Query Parameters Reference

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `page` | `number` | `?page=1` | Pagination page number |
| `limit` | `number` | `?limit=20` | Items per page |
| `sort` | `string` | `?sort=price_asc` | Sort order (`price_asc`, `price_desc`, `newest`, `popular`) |
| `category` | `string` | `?category=vegetables` | Filter by category slug |
| `minPrice` | `number` | `?minPrice=10` | Minimum price filter |
| `maxPrice` | `number` | `?maxPrice=500` | Maximum price filter |
| `rating` | `number` | `?rating=4` | Minimum star rating |
| `brand` | `string` | `?brand=organic-india` | Filter by brand slug |
| `q` | `string` | `?q=tomato` | Search keyword |
| `pincode` | `string` | `?pincode=110001` | Delivery pincode check |

---

## 🔐 Authentication

All protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>

```

## 📬 Response Format

```json
{
  "success": true,
  "data": { },
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```


# Voice Agent Remaining Works (Functions).
1. For Checkout
2. For order stauts its a webhook
3. For tracking order its a webhook
4. Cart Summery
5. Proceed to Checkout
6. Place order.