import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getOrderById } from "@/lib/orders";
import { formatOrderNumber, formatPrice } from "@/lib/format";
import ClearCartOnMount from "@/components/ClearCartOnMount";

// Mercado Pago vuelve acá con back_urls.success cuando auto_return
// dispara con el pago aprobado. IMPORTANTE: esto es sólo una vuelta
// del navegador, no una confirmación de pago — el estado real del
// pedido lo definió (o va a definir) el webhook. Por eso esta página
// lee el estado actual del pedido en la base en vez de asumir "pagado".
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ external_reference?: string; payment_id?: string }>;
}) {
  const { external_reference: orderId } = await searchParams;
  const order =
    orderId && isSupabaseConfigured ? await getOrderById(orderId).catch(() => null) : null;

  const isConfirmed = order?.status === "approved";

  return (
    <div className="confirm">
      <ClearCartOnMount />
      <div className="check">✓</div>
      <h2 className="serif">¡Gracias por tu compra!</h2>
      <p>
        {isConfirmed
          ? "Tu pago fue confirmado y ya estamos preparando tu pedido."
          : "Recibimos tu pago y lo estamos confirmando con Mercado Pago. Te avisamos por email apenas quede acreditado."}
      </p>

      {order && (
        <div className="order-box">
          <div className="row">
            <span>N° de pedido</span>
            <b>{formatOrderNumber(order.id)}</b>
          </div>
          <div className="row">
            <span>Método de pago</span>
            <b>Mercado Pago</b>
          </div>
          <div className="row">
            <span>Estado</span>
            <b>{isConfirmed ? "Confirmado" : "Confirmando pago"}</b>
          </div>
          <div className="row">
            <span>Total</span>
            <b>{formatPrice(order.total)}</b>
          </div>
        </div>
      )}

      <div className="actions">
        <Link href="/">
          <button className="btn-primary" style={{ background: "var(--champagne)" }}>
            Seguir comprando
          </button>
        </Link>
      </div>

      {order && !isConfirmed && (
        // El webhook puede tardar unos segundos en llegar. Mientras el
        // pedido siga "pending", refrescamos solos hasta que se confirme
        // (o el usuario se va de la página) — así no depende de que la
        // clienta recargue a mano para ver el estado final.
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: `setTimeout(() => location.reload(), 3000);` }}
        />
      )}
    </div>
  );
}
