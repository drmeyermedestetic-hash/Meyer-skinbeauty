import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <>
      <div className="topbar">
        <h1>Nuevo producto</h1>
        <div className="actions">
          <Link href="/admin/productos" className="btn btn-outline">
            ← Volver
          </Link>
        </div>
      </div>
      <div className="page">
        <ProductForm mode="create" />
      </div>
    </>
  );
}
