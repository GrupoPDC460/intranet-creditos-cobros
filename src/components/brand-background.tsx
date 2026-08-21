"use client";

import { useEffect, useState } from "react";

// Wallpapers de marca Grupo PDC. Rotan con transición suave cada 5 minutos.
const IMAGES = ["/brand-bg.jpg", "/brand-bg-1.jpg", "/brand-bg-2.jpg", "/brand-bg-3.jpg"];
const INTERVAL_MS = 5 * 60 * 1000;

export function BrandBackground() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % IMAGES.length);
    }, INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="brand-bg" aria-hidden="true">
      {IMAGES.map((src, i) => (
        <div
          key={src}
          className={"brand-bg__layer" + (i === idx ? " is-active" : "")}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      <div className="brand-bg__overlay" />
    </div>
  );
}
