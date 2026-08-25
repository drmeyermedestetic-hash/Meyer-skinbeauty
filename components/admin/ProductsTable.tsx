"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";

interface ProductRow {
  id: string;
  sku: string;
  slug: string;
  name: string;
  price: number | null;
  sale_price: number | null;
  stock: number;
  low_stock_threshold: number;
  active: boolean;
  brand: { name: string } | null;
  category: { name: string; slug: string; parent: { name: string; slug: string } | null } | null;
}

function stockPill(p: ProductRow) {
  if (p.stock <= 0) return <span className="pill stock-out">Sin stock</span>;
  if (p.stock <= p.low_stock_threshold) return <span className="pill stock-low">Pocas unidades</span>;
  return <span className="pill stock-ok">En stock</span>;
}

export default function ProductsTable({ products }: { products: ProductRow[] }) {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      `${p.name} ${p.brand?.name ?? ""} ${p.sku}`.toLowerCase().includes(q)
    );
  }, [products, search]);

  async function toggleActive(p: ProductRow) {
    setBusyId(p.id);
    try {
      if (p.active) {
        await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/admin/products/${p.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku: p.sku,
            name: p.name,
            category: p.category?.parent?.name ?? p.category?.name ?? "Sin categoría",
            subcategory: p.category?.parent ? p.category.name : undefined,
            brand: p.brand?.name,
            price: p.price,
            salePrice: p.sale_price,
            stock: p.stock,
            active: true,
          }),
        });
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card">
      <div className="searchbar">
        <input
          placeholder="Buscar por nombre, marca o SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="prod-name">
                    <div className="prod-thumb">🧴</div>
                    <div>
                      <div className="n">{p.name}</div>
                      <div className="b">
                        {p.brand?.name ?? "Sin marca"} · {p.sku}
                      </div>
                    </div>
                  </div>
                </td>
                <td>{p.category?.parent?.name ?? p.category?.name ?? "—"}</td>
                <td>
                  {p.price === null ? (
                    <span style={{ color: "var(--muted)" }}>A confirmar</span>
                  ) : p.sale_price ? (
                    <>
                      <s style={{ color: "var(--muted)" }}>{formatPrice(p.price)}</s>{" "}
                      {formatPrice(p.sale_price)}
                    </>
                  ) : (
                    formatPrice(p.price)
                  )}
                </td>
                <td>
                  {stockPill(p)}{" "}
                  <span style={{ color: "var(--muted)", fontSize: 11 }}>({p.stock})</span>
                </td>
                <td>
                  {p.active ? (
                    <span className="pill stock-ok">Activo</span>
                  ) : (
                    <span className="pill stock-out">Inactivo</span>
                  )}
                </td>
                <td>
                  <div className="row-actions">
                    <Link href={`/admin/productos/${p.id}/editar`}>Editar</Link>
                    <button disabled={busyId === p.id} onClick={() => toggleActive(p)}>
                      {p.active ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--muted)" }}>
                  No hay productos que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
