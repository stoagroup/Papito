"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function Logo({ size = 44, withText = true, dark = false }: { size?: number; withText?: boolean; dark?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Papito — на главную">
      <span
        className="relative shrink-0 overflow-hidden rounded-full bg-white"
        style={{ width: size, height: size }}
      >
        <Image src="/images/logo.png" alt="" fill sizes={`${size}px`} className="object-cover" priority />
      </span>
      {withText && (
        <span className={`font-display text-xl font-black tracking-tight ${dark ? "text-ink" : "text-cream"}`}>
          PAPITO<span className="text-orange">.</span>
        </span>
      )}
    </Link>
  );
}

/** Фото позиции: путь, URL или data:URL. Без фото — фирменная заглушка. */
export function FoodImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden bg-ink ${className}`}>
        <div className="relative flex flex-col items-center gap-2 text-center">
          <span className="relative size-14 overflow-hidden rounded-full bg-white ring-2 ring-mustard">
            <Image src="/images/logo.png" alt="" fill sizes="56px" className="object-cover" />
          </span>
          <span className="font-display text-[10px] font-bold tracking-[0.25em] text-cream/60 uppercase">Фото скоро</span>
        </div>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- источник может быть data:URL или внешней ссылкой из панели управления
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
  );
}

/** Плавное появление при прокрутке. */
export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${visible ? "is-visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function SectionTitle({ eyebrow, title, text, light = false }: { eyebrow: string; title: React.ReactNode; text?: string; light?: boolean }) {
  return (
    <div className="max-w-2xl">
      <p className="mb-3 inline-flex items-center gap-2 font-display text-xs font-bold tracking-[0.2em] text-orange uppercase">
        <span className="h-0.5 w-6 bg-orange" />
        {eyebrow}
      </p>
      <h2 className={`font-display text-3xl leading-[1.05] font-black tracking-tight text-balance sm:text-5xl ${light ? "text-cream" : "text-ink"}`}>
        {title}
      </h2>
      {text && <p className={`mt-4 text-base sm:text-lg ${light ? "text-cream/70" : "text-ink/65"}`}>{text}</p>}
    </div>
  );
}

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-mustard px-6 py-3 font-bold text-ink transition-colors hover:bg-yellow-400 disabled:pointer-events-none disabled:opacity-50";
export const btnDark =
  "inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 font-bold text-cream transition hover:bg-ink-3 disabled:pointer-events-none disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-current/20 px-5 py-3 font-semibold transition hover:border-current/50 hover:bg-current/5 disabled:pointer-events-none disabled:opacity-50";
export const inputCls =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition placeholder:text-ink/35 focus:border-orange focus:ring-4 focus:ring-orange/15";
