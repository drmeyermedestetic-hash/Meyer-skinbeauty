const LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const CLASSES: Record<string, string> = {
  pending: "status-pending",
  approved: "status-paid",
  rejected: "status-cancelled",
  cancelled: "status-cancelled",
  refunded: "status-cancelled",
};

export default function StatusPill({ status }: { status: string }) {
  return (
    <span className={`pill ${CLASSES[status] ?? "status-pending"}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
