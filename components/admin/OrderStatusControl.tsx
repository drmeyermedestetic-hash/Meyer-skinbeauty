"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  { value: "pending", label: "Pendiente" },
  { value: "approved", label: "Aprobado" },
  { value: "rejected", label: "Rechazado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "refunded", label: "Reembolsado" },
];

export default function OrderStatusControl({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(newStatus: string) {
    setStatus(newStatus);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo actualizar el estado");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "No se pudo actualizar el estado");
      setStatus(currentStatus);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="field" style={{ maxWidth: 260 }}>
      <label>Estado del pedido</label>
      <select value={status} disabled={saving} onChange={(e) => handleChange(e.target.value)}>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {error && <p className="co-error">{error}</p>}
      <p className="co-hint" style={{ marginTop: 6 }}>
        El camino normal es que Mercado Pago confirme el pago solo (vía
        webhook). Cambiá esto a mano sólo para casos excepcionales
        (cancelación, reembolso gestionado fuera de MP).
      </p>
    </div>
  );
}
