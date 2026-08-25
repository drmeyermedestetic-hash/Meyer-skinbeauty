import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import StatusPill from "@/components/admin/StatusPill";
import OrderStatusControl from "@/components/admin/OrderStatusControl";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `*,
       customer:customers(first_name, last_name, email, phone),
       address:addresses(street, number, city, province, postal_code),
       coupon:coupons(code)`
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_sku, product_name, unit_price, quantity, line_total")
    .eq("order_id", id);

  const customer = order.customer as any;
  const address = order.address as any;
  const coupon = order.coupon as any;

  return (
    <>
      <div className="topbar">
        <h1>Pedido {order.order_number ?? order.id.slice(0, 8)}</h1>
        <div className="actions">
          <Link href="/admin/pedidos" className="btn btn-outline">
            ← Volver
          </Link>
        </div>
      </div>

      <div className="page" style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div className="card" style={{ flex: "2 1 420px" }}>
          <div className="card-head">
            <h3>Items</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Cantidad</th>
                <th>Precio unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((it) => (
                <tr key={it.id}>
                  <td>{it.product_name}</td>
                  <td>{it.product_sku}</td>
                  <td>{it.quantity}</td>
                  <td>{formatPrice(it.unit_price)}</td>
                  <td>{formatPrice(it.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "16px 20px", borderTop: "1px solid #E1D6C0" }}>
            <div className="sum-row">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="sum-row">
                <span>Descuento{coupon ? ` (${coupon.code})` : ""}</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="sum-row">
              <span>Envío</span>
              <span>{formatPrice(order.shipping_cost)}</span>
            </div>
            <div className="sum-row total">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card">
            <div className="card-head">
              <h3>Estado</h3>
              <StatusPill status={order.status} />
            </div>
            <div style={{ padding: 20 }}>
              <OrderStatusControl orderId={order.id} currentStatus={order.status} />
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Cliente</h3>
            </div>
            <div style={{ padding: "16px 20px", fontSize: 13, lineHeight: 1.7 }}>
              {customer ? (
                <>
                  {customer.first_name} {customer.last_name}
                  <br />
                  {customer.email}
                  <br />
                  {customer.phone}
                </>
              ) : (
                <span style={{ color: "var(--muted)" }}>Sin datos de cliente</span>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Envío</h3>
            </div>
            <div style={{ padding: "16px 20px", fontSize: 13, lineHeight: 1.7 }}>
              {order.shipping_method === "retiro_local" ? (
                "Retiro en local"
              ) : address ? (
                <>
                  {address.street} {address.number}
                  <br />
                  {address.city}, {address.province}
                  <br />
                  CP {address.postal_code}
                </>
              ) : (
                <span style={{ color: "var(--muted)" }}>Sin dirección cargada</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
