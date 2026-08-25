"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { getShippingOptions, PICKUP_OPTION, type ShippingOption } from "@/lib/shipping";
import type { ShippingMethod } from "@/lib/types";

export default function CheckoutPage() {
  const { items, subtotal } = useCart();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("domicilio");
  const [shippingOptionId, setShippingOptionId] = useState<string>("standard");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const homeOptions = useMemo(() => getShippingOptions(postalCode), [postalCode]);
  const selectedShipping: ShippingOption | null =
    shippingMethod === "retiro_local"
      ? PICKUP_OPTION
      : homeOptions.find((o) => o.id === shippingOptionId) ?? null;

  const shippingCost = selectedShipping?.cost ?? 0;
  const total = subtotal + shippingCost;

  const canSubmit =
    items.length > 0 &&
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    (shippingMethod === "retiro_local" ||
      (street.trim() && postalCode.trim() && selectedShipping));

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((it) => ({ product_id: it.sku, quantity: it.quantity })),
          customer: { email, firstName, lastName, phone },
          shippingMethod,
          shippingAddress:
            shippingMethod === "domicilio"
              ? { street, city, postalCode }
              : null,
          shippingCost,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo iniciar el pago");
      }
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setError(err.message ?? "No se pudo iniciar el pago");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <>
        <div className="page-head">
          <Link href="/" className="back">
            ←
          </Link>
          <h2>Checkout</h2>
        </div>
        <div className="page-empty">
          Tu carrito está vacío. <Link href="/">Volver a la tienda</Link>
        </div>
      </>
    );
  }

  return (
    <div className="checkout-page">
      <div className="page-head">
        <Link href="/" className="back">
          ←
        </Link>
        <h2>Checkout</h2>
      </div>

      <div className="co-section">
        <h4>Datos de contacto</h4>
        <div className="field-row">
          <div className="field">
            <label>Nombre</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Mario" />
          </div>
          <div className="field">
            <label>Apellido</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Meyer" />
          </div>
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />
        </div>
        <div className="field">
          <label>Teléfono</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 9 ..." />
        </div>
      </div>

      <div className="co-section">
        <h4>Método de envío</h4>
        <label className={`ship-option${shippingMethod === "domicilio" ? " selected" : ""}`}>
          <input
            type="radio"
            name="shipMethod"
            checked={shippingMethod === "domicilio"}
            onChange={() => setShippingMethod("domicilio")}
          />
          <span className="meta">Envío a domicilio</span>
        </label>
        <label className={`ship-option${shippingMethod === "retiro_local" ? " selected" : ""}`}>
          <input
            type="radio"
            name="shipMethod"
            checked={shippingMethod === "retiro_local"}
            onChange={() => setShippingMethod("retiro_local")}
          />
          <span className="meta">Retiro en local</span>
          <span className="cost">Gratis</span>
        </label>

        {shippingMethod === "domicilio" && (
          <>
            <div className="field-row" style={{ marginTop: 12 }}>
              <div className="field">
                <label>Dirección</label>
                <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Calle y número" />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Código postal</label>
                <input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="4000"
                />
              </div>
              <div className="field">
                <label>Ciudad</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="San Miguel de Tucumán" />
              </div>
            </div>

            {homeOptions.length === 0 ? (
              <p className="co-hint">Ingresá tu código postal para ver las opciones de envío.</p>
            ) : (
              homeOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`ship-option${shippingOptionId === opt.id ? " selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="shipOption"
                    checked={shippingOptionId === opt.id}
                    onChange={() => setShippingOptionId(opt.id)}
                  />
                  <span className="meta">
                    {opt.label}
                    <br />
                    <span className="co-hint">{opt.etaDays}</span>
                  </span>
                  <span className="cost">{formatPrice(opt.cost)}</span>
                </label>
              ))
            )}
          </>
        )}
      </div>

      <div className="co-section">
        <h4>Método de pago</h4>
        <label className="pay-option selected">
          <input type="radio" name="pay" checked readOnly />
          Mercado Pago — tarjetas, transferencia y más
        </label>
        <label className="pay-option disabled">
          <input type="radio" name="pay" disabled />
          Efectivo (Rapipago / Pago Fácil) — próximamente
        </label>
      </div>

      <div className="co-section" style={{ borderBottom: "none" }}>
        <h4>Resumen</h4>
        <div className="sum-row">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="sum-row">
          <span>Envío</span>
          <span>{selectedShipping ? formatPrice(shippingCost) : "A confirmar"}</span>
        </div>
        <div className="sum-row total">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <div className="co-submit">
        <button onClick={handleSubmit} disabled={!canSubmit || submitting}>
          {submitting ? "Redirigiendo a Mercado Pago…" : "Pagar con Mercado Pago"}
        </button>
        {error && <p className="co-error">{error}</p>}
      </div>
    </div>
  );
}
