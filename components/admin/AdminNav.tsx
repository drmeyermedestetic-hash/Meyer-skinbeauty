"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin/productos", label: "Productos", icon: "▤" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "▥" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav>
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={pathname?.startsWith(item.href) ? "active" : ""}
        >
          <span className="ic">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
