"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";

interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

export default function ProductAccordion({ product }: { product: Product }) {
  const items: AccordionItem[] = [
    product.benefits.length > 0 && {
      title: "Beneficios",
      content: (
        <ul>
          {product.benefits.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ),
    },
    product.keyIngredients.length > 0 && {
      title: "Ingredientes clave",
      content: <p>{product.keyIngredients.join(", ")}</p>,
    },
    product.skinType.length > 0 && {
      title: "Ideal para",
      content: <p>{product.skinType.join(", ")}</p>,
    },
    product.usageInstructions && {
      title: "Modo de uso",
      content: <p>{product.usageInstructions}</p>,
    },
    (product.origin || product.size) && {
      title: "Detalles",
      content: (
        <p>
          {product.origin && <>Origen: {product.origin}. </>}
          {product.size && <>Contenido: {product.size}.</>}
        </p>
      ),
    },
  ].filter(Boolean) as AccordionItem[];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <div className="accordion">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div className={`acc-item${isOpen ? " open" : ""}`} key={item.title}>
            <button
              className="acc-head"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span>{item.title}</span>
              <span className="chevron">⌄</span>
            </button>
            <div
              className="acc-body"
              style={{ maxHeight: isOpen ? "600px" : "0" }}
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
