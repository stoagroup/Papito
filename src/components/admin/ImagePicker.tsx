"use client";

import { useRef, useState } from "react";
import { Check, ImageOff, Link2, Loader2, Upload } from "lucide-react";
import { brandPhotos } from "@/data/initialData";
import { FoodImage, inputCls } from "../ui";

/** Сжимает загруженное фото до JPEG ~900px, чтобы оно поместилось в localStorage. */
function fileToDataUrl(file: File, maxSide = 900, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Не удалось прочитать изображение"));
    };
    img.src = url;
  });
}

export function ImagePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState(value.startsWith("http") ? value : "");

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setError("");
    if (!f.type.startsWith("image/")) {
      setError("Выберите файл изображения (JPG, PNG, WebP).");
      return;
    }
    setBusy(true);
    try {
      onChange(await fileToDataUrl(f));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[112px_1fr] gap-3">
        <div className="relative aspect-square overflow-hidden rounded-2xl ring-1 ring-ink/10">
          <FoodImage src={value} alt="Предпросмотр" className="size-full" />
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/60 text-cream">
              <Loader2 className="size-6 animate-spin" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-3 py-2.5 text-sm font-bold text-cream transition hover:bg-ink-3">
            <Upload className="size-4" /> Загрузить фото
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          {value && (
            <button type="button" onClick={() => { onChange(""); setUrl(""); }} className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-ink/60 ring-1 ring-ink/10 transition hover:text-brand">
              <ImageOff className="size-4" /> Без фото
            </button>
          )}
          <p className="text-xs text-ink/45">Фото сжимается и хранится в браузере.</p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-bold text-ink/55">Или фото из фирменной галереи</p>
        <div className="grid grid-cols-4 gap-2">
          {brandPhotos.map((p) => (
            <button
              key={p.src}
              type="button"
              onClick={() => onChange(p.src)}
              title={p.label}
              className={`relative aspect-square overflow-hidden rounded-xl ring-2 transition ${value === p.src ? "ring-orange" : "ring-transparent hover:ring-ink/20"}`}
            >
              <FoodImage src={p.src} alt={p.label} className="size-full" />
              {value === p.src && (
                <span className="absolute top-1 right-1 rounded-full bg-orange p-0.5 text-white">
                  <Check className="size-3" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-ink/55">
          <Link2 className="size-3.5" /> Или ссылка на изображение
        </span>
        <div className="flex gap-2">
          <input className={`${inputCls} py-2.5 text-sm`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" type="url" />
          <button type="button" disabled={!/^https?:\/\//.test(url)} onClick={() => onChange(url.trim())} className="shrink-0 rounded-xl bg-cream-2 px-4 text-sm font-bold transition hover:bg-cream-3 disabled:opacity-40">
            OK
          </button>
        </div>
      </label>
      {error && <p className="text-sm font-semibold text-brand">{error}</p>}
    </div>
  );
}
