import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Product } from "@/types";
import ProductGrid from "@/components/product/ProductGrid";

interface Props {
  title: string;
  viewAllHref?: string;
  products: Product[];
  columns?: 2 | 3 | 4;
}

export default function ProductSection({ title, viewAllHref, products, columns = 4 }: Props) {
  return (
    <section className="my-8">
      <div className="flex items-end justify-between mb-5">
        <h2 className="section-title">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-sm font-semibold transition-colors hover:underline"
            style={{ color: "var(--color-primary)" }}
          >
            View All <ArrowRight size={14} />
          </Link>
        )}
      </div>
      <ProductGrid products={products} columns={columns} />
    </section>
  );
}
