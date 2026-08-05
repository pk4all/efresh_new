import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/products" className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 mb-6 transition-colors">
        <ArrowLeft size={16} className="mr-1.5" /> Back to Products
      </Link>
      <div className="card p-8 md:p-12">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b pb-4">Terms & Conditions</h1>
        
        <div className="space-y-6 text-gray-600">
          <p className="leading-relaxed">
            Welcome to eFresh. By accessing or using our website, you agree to be bound by these terms and conditions.
          </p>
          
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Use of the Site</h2>
            <p className="leading-relaxed mb-2">
              You must be at least 18 years old to use our service. You agree to provide accurate and complete information when creating an account and placing orders.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Pricing and Availability</h2>
            <p className="leading-relaxed mb-2">
              All prices are subject to change without notice. We reserve the right to limit the quantity of items purchased and to cancel orders if necessary due to inventory shortages.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Liability</h2>
            <p className="leading-relaxed mb-2">
              eFresh shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
