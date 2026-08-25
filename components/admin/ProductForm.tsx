"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ProductFormValues {
  sku: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  shortDescription: string;
  description: string;
  benefits: string;
  keyIngredients: string;
  skinTypes: string;
  howToUse: string;
  countryOfOrigin: string;
  size: string;
  price: string;
  salePrice: string;
  stock: string;
  mainImage: string;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  active: boolean;
}

const EMPTY_VALUES: ProductFormValues = {
  sku: "",
  name: "",
  brand: "",
  category: "",
  subcategory: "",
  shortDescription: "",
  description: "",
  benefits: "",
  keyIngredients: "",
  skinTypes: "",
  howToUse: "",
  countryOfOrigin: "",
  size: "",
  price: "",
  salePrice: "",
  stock: "0",
  mainImage: "",
  featured: false,
  bestSeller: false,
  newArrival: false,
  active: true,
};

const CATEGORY_SUGGESTIONS = [
  "Skincare Coreano",
  "Medical Skincare",
  "Body & Fragrances",
  "Mascarillas Coreanas",
  "Labios",
];

export default function ProductForm({
  mode,
  productId,
  initialValues,
}: {
  mode: "create" | "edit";
  productId?: string;
  initialValues?: Partial<ProductFormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>({ ...EMPTY_VALUES, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = mode === "create" ? "/api/admin/products" : `/api/admin/products/${productId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar el producto");
      router.push("/admin/productos");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "No se pudo guardar el producto");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 640 }}>
      <div style={{ padding: 22 }}>
        <div className="field-row">
          <div className="field">
            <label>Marca</label>
            <input value={values.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Arencia" />
          </div>
          <div className="field">
            <label>SKU</label>
            <input
              required
              value={values.sku}
              onChange={(e) => set("sku", e.target.value)}
              placeholder="ARE-MOC-001"
            />
          </div>
        </div>

        <div className="field">
          <label>Nombre del producto</label>
          <input required value={values.name} onChange={(e) => set("name", e.target.value)} />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Categoría</label>
            <input
              required
              list="admin-categories"
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
            />
            <datalist id="admin-categories">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label>Subcategoría (opcional)</label>
            <input
              value={values.subcategory}
              onChange={(e) => set("subcategory", e.target.value)}
              placeholder="Limpiadores"
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Precio</label>
            <input
              type="number"
              min="0"
              step="1"
              value={values.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="32900"
            />
          </div>
          <div className="field">
            <label>Precio oferta (opcional)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={values.salePrice}
              onChange={(e) => set("salePrice", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Stock</label>
            <input
              type="number"
              min="0"
              step="1"
              value={values.stock}
              onChange={(e) => set("stock", e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Descripción corta</label>
          <input
            value={values.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Qué es</label>
          <textarea value={values.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="field">
          <label>Beneficios (separados por coma)</label>
          <input value={values.benefits} onChange={(e) => set("benefits", e.target.value)} />
        </div>
        <div className="field">
          <label>Ingredientes clave (separados por coma)</label>
          <input
            value={values.keyIngredients}
            onChange={(e) => set("keyIngredients", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Tipo de piel / ideal para (separados por coma)</label>
          <input value={values.skinTypes} onChange={(e) => set("skinTypes", e.target.value)} />
        </div>
        <div className="field">
          <label>Modo de uso</label>
          <textarea value={values.howToUse} onChange={(e) => set("howToUse", e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Origen</label>
            <input
              value={values.countryOfOrigin}
              onChange={(e) => set("countryOfOrigin", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Tamaño / contenido</label>
            <input value={values.size} onChange={(e) => set("size", e.target.value)} placeholder="30 ml" />
          </div>
        </div>
        <div className="field">
          <label>URL de imagen principal (opcional)</label>
          <input value={values.mainImage} onChange={(e) => set("mainImage", e.target.value)} />
        </div>

        <div className="toggle-row">
          <label>
            <input
              type="checkbox"
              checked={values.featured}
              onChange={(e) => set("featured", e.target.checked)}
            />{" "}
            Destacado
          </label>
          <label>
            <input
              type="checkbox"
              checked={values.bestSeller}
              onChange={(e) => set("bestSeller", e.target.checked)}
            />{" "}
            Best seller
          </label>
          <label>
            <input
              type="checkbox"
              checked={values.newArrival}
              onChange={(e) => set("newArrival", e.target.checked)}
            />{" "}
            Novedad
          </label>
          <label>
            <input
              type="checkbox"
              checked={values.active}
              onChange={(e) => set("active", e.target.checked)}
            />{" "}
            Activo
          </label>
        </div>

        {error && <p className="co-error">{error}</p>}
      </div>
      <div className="modal-foot">
        <button type="button" className="btn btn-outline" onClick={() => router.push("/admin/productos")}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-dark" disabled={saving}>
          {saving ? "Guardando…" : "Guardar producto"}
        </button>
      </div>
    </form>
  );
}
