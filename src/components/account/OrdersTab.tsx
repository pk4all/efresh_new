"use client";

import { CheckCircle, Clock } from "lucide-react";

interface OrderItem {
  product: any;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  items: OrderItem[];
}

interface OrdersTabProps {
  orders: Order[];
}

export default function OrdersTab({ orders }: OrdersTabProps) {
  return (
    <div>
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-xl font-black text-gray-800 tracking-tight">Order History</h2>
        <p className="text-xs text-gray-400 mt-1">Track and view invoices for all your recent orders.</p>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
            {/* Order Header info block */}
            <div className="bg-gray-50/70 border-b border-gray-100 p-4 sm:px-6 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-6 text-xs">
                <div>
                  <span className="block text-gray-400 font-semibold uppercase tracking-wider">Order ID</span>
                  <span className="font-bold text-gray-800">{order.id}</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-semibold uppercase tracking-wider">Date</span>
                  <span className="font-semibold text-gray-700">{order.date}</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-semibold uppercase tracking-wider">Total</span>
                  <span className="font-extrabold text-[#0da487]">${order.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Order status badges */}
              <div className="flex items-center gap-2">
                {order.status === "Delivered" ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckCircle size={12} /> Delivered
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                    <Clock size={12} /> Pending Delivery
                  </span>
                )}
              </div>
            </div>

            {/* Order Product list */}
            <div className="p-4 sm:p-6 divide-y divide-gray-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0 items-center">
                  <div className="w-14 h-14 rounded-xl border border-gray-100 overflow-hidden flex-shrink-0 bg-gray-50">
                    <img src={item.product?.image} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-grow">
                    <h5 className="font-bold text-sm text-gray-800 hover:text-[#0da487] transition-colors leading-snug">
                      {item.product?.name}
                    </h5>
                    <p className="text-xs text-gray-400 font-semibold mt-1">
                      Qty: {item.qty} • Rate: ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-gray-800">${(item.qty * item.price).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
