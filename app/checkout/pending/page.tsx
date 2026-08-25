import Link from "next/link";
import { formatOrderNumber } from "@/lib/format";
import ClearCartOnMount from "@/components/ClearCartOnMount";

export default async function CheckoutPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ external_reference?: string }>;
}) {
  const { external_reference: orderId } = await searchParams;

  return (
    <div className="confirm">
      <ClearCartOnMount />
      <div className="check">⏳</div>
      <h2 className="serif">Pago en proceso</h2>
      <p>
        Tu pago está siendo procesado por Mercado Pago (por ejemplo, pago en
        efectivo o transferencia). Te vamos a avisar por email en cuanto se
        confirme.
      </p>
      {orderId && (
        <div className="order-box">
          <div className="row">
            <span>N° de pedido</span>
            <b>{formatOrderNumber(orderId)}</b>
          </div>
          <div className="row">
            <span>Estado</span>
            <b>Pendiente</b>
          </div>
        </div>
      )}
      <div className="actions">
        <Link href="/">
          <button className="btn-primary" style={{ background: "var(--champagne)" }}>
            Volver a la tienda
          </button>
        </Link>
      </div>
    </div>
  );
}
