import Link from "next/link";

export default function CheckoutFailurePage() {
  return (
    <div className="confirm">
      <div className="check" style={{ borderColor: "#c96b6b", color: "#c96b6b" }}>
        ✕
      </div>
      <h2 className="serif">No pudimos procesar tu pago</h2>
      <p>
        Mercado Pago rechazó el pago o cancelaste el proceso. Tu carrito
        sigue guardado — podés intentar de nuevo o probar con otro medio de
        pago.
      </p>
      <div className="actions">
        <Link href="/checkout">
          <button className="btn-primary" style={{ background: "var(--champagne)" }}>
            Reintentar pago
          </button>
        </Link>
        <Link href="/">
          <button className="btn-outline" style={{ borderColor: "#fff", color: "#fff" }}>
            Volver a la tienda
          </button>
        </Link>
      </div>
    </div>
  );
}
