import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/products" className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 mb-6 transition-colors">
        <ArrowLeft size={16} className="mr-1.5" /> Back to Products
      </Link>
      <div className="card p-8 md:p-12">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b pb-4">Shipping Policy</h1>
        
        <div className="space-y-6 text-gray-600">
          <p className="leading-relaxed">
            At eFresh, we strive to deliver your groceries as quickly and freshly as possible. Below are the details of our shipping policy.
          </p>
          
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Delivery Zones & Times</h2>
            <p className="leading-relaxed mb-2">
              We currently deliver to select zones. Delivery times and available days vary by location. Please check your pincode at checkout to see available delivery slots.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Shipping Rates</h2>
            <p className="leading-relaxed mb-2">
              - <strong>Free Delivery:</strong> On all orders over $50.<br />
              - <strong>Standard Delivery:</strong> $4.99 flat rate for orders under $50.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
