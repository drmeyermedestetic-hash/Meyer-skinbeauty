import Link from "next/link";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import StatusPill from "@/components/admin/StatusPill";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, total, payment_provider, created_at,
       customer:customers(first_name, last_name, email)`
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <div className="topbar">
        <h1>Pedidos</h1>
      </div>
      <div className="page">
        <div className="card">
          {error ? (
            <div className="page-empty">No se pudieron cargar los pedidos: {error.message}</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>N° pedido</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Pago</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(data ?? []).map((o: any) => (
                    <tr key={o.id}>
                      <td>{o.order_number ?? o.id.slice(0, 8)}</td>
                      <td>
                        {o.customer
                          ? `${o.customer.first_name ?? ""} ${o.customer.last_name ?? ""}`.trim() ||
                            o.customer.email
                          : "—"}
                      </td>
                      <td>{new Date(o.created_at).toLocaleDateString("es-AR")}</td>
                      <td>{formatPrice(o.total)}</td>
                      <td>{o.payment_provider === "mercado_pago" ? "Mercado Pago" : o.payment_provider}</td>
                      <td>
                        <StatusPill status={o.status} />
                      </td>
                      <td>
                        <div className="row-actions">
                          <Link href={`/admin/pedidos/${o.id}`}>Ver</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(data ?? []).length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)" }}>
                        Todavía no hay pedidos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
