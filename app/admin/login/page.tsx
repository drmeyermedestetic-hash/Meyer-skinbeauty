"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(
        err.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos."
          : err.message ?? "No se pudo iniciar sesión."
      );
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--black)",
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--white)",
          padding: 32,
          width: "100%",
          maxWidth: 360,
        }}
      >
        <div
          className="serif"
          style={{
            fontSize: 20,
            letterSpacing: "0.1em",
            marginBottom: 4,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Image src="/logo-meyer.png" alt="" width={44} height={44} />
          MEYER
        </div>
        <p
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--muted)",
            textAlign: "center",
            marginBottom: 26,
          }}
        >
          Panel administrativo
        </p>

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="co-error">{error}</p>}

        <button
          type="submit"
          className="btn-add"
          disabled={loading}
          style={{ width: "100%", marginTop: 8 }}
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
