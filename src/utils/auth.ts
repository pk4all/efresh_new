"use client";

import { toast } from "sonner";

/**
 * Checks if the API response or error indicates an invalid or expired token.
 * If so, deletes the user session and triggers the login popup.
 */
export function handleAuthError(detail: any): boolean {
  const errMsg = typeof detail === "string" ? detail : (detail?.[0]?.msg || detail?.msg || JSON.stringify(detail));
  
  if (errMsg && (errMsg.includes("Invalid or expired token") || errMsg.includes("expired token") || errMsg.includes("invalid token"))) {
    // Delete session
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("customer_id");
    
    // Sync states across header and components
    window.dispatchEvent(new Event("storage"));
    
    // Open login popup
    window.dispatchEvent(new Event("open-login-modal"));
    
    toast.error("Your session has expired. Please login again.");
    return true;
  }
  return false;
}
