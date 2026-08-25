import Link from "next/link";
import type { Category } from "@/lib/types";

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="cat-grid">
      {categories.map((cat) => (
        <Link key={cat.slug} href={`/categoria/${cat.slug}`} className="cat-item">
          <div className="cat-circle" aria-hidden="true">
            {cat.icon}
          </div>
          <span>{cat.name}</span>
        </Link>
      ))}
    </div>
  );
}
