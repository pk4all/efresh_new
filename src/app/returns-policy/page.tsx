import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ReturnsPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/products" className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 mb-6 transition-colors">
        <ArrowLeft size={16} className="mr-1.5" /> Back to Products
      </Link>
      <div className="card p-8 md:p-12">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b pb-4">Returns & Refund Policy</h1>
        
        <div className="space-y-6 text-gray-600">
          <p className="leading-relaxed">
            Your satisfaction is our priority. If you are not entirely satisfied with your purchase, we're here to help.
          </p>
          
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Returns</h2>
            <p className="leading-relaxed mb-2">
              Since we deal with fresh produce and perishable goods, we generally do not accept returns on these items once delivered. However, if an item arrives damaged or spoiled, please contact us within 24 hours of delivery.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Refunds</h2>
            <p className="leading-relaxed mb-2">
              Once we verify your claim regarding damaged or incorrect items, we will initiate a refund to your original method of payment. You will receive the credit within a certain amount of days, depending on your card issuer's policies.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
