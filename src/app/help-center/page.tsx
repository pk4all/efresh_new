import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function HelpCenterPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/products" className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 mb-6 transition-colors">
        <ArrowLeft size={16} className="mr-1.5" /> Back to Products
      </Link>
      <div className="card p-8 md:p-12">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b pb-4">Help Center & FAQ</h1>
        
        <div className="space-y-6 text-gray-600">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. How do I place an order?</h2>
            <p className="leading-relaxed">
              Browse our products, add them to your cart, and proceed to checkout. You will need to create an account or log in to complete your purchase.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. What payment methods do you accept?</h2>
            <p className="leading-relaxed">
              We accept Visa, Mastercard, UPI, Apple Pay, and PayPal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Need more help?</h2>
            <p className="leading-relaxed">
              Contact our support team at <strong>support@efresh.com</strong> or call us during business hours.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
