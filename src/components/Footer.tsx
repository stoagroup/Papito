import Link from "next/link";
import { ChefHat, Info, SlidersHorizontal } from "lucide-react";
import { Logo } from "./ui";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-black text-cream">
      <div className="pointer-events-none absolute -bottom-16 left-1/2 -translate-x-1/2 font-display text-[22vw] leading-none font-black tracking-tighter whitespace-nowrap text-cream/[0.035] select-none">
        PAPITO
      </div>
      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo size={52} />
            <p className="mt-5 max-w-sm text-cream/60">Бургеры, роллы, курица с гриля и хрустящий картофель. Свежо, быстро и с большими порциями.</p>
          </div>
          <div>
            <h3 className="font-display text-sm font-bold tracking-widest text-cream/40 uppercase">Разделы</h3>
            <ul className="mt-4 space-y-2.5 font-semibold">
              <li><Link className="transition hover:text-orange" href="/#menu">Меню</Link></li>
              <li><Link className="transition hover:text-orange" href="/#promo">Акции</Link></li>
              <li><Link className="transition hover:text-orange" href="/#about">О нас</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-sm font-bold tracking-widest text-cream/40 uppercase">Демо-инструменты</h3>
            <ul className="mt-4 space-y-2.5 font-semibold">
              <li>
                <Link className="inline-flex items-center gap-2 transition hover:text-orange" href="/kitchen">
                  <ChefHat className="size-4" /> Панель кухни
                </Link>
              </li>
              <li>
                <Link className="inline-flex items-center gap-2 transition hover:text-orange" href="/admin">
                  <SlidersHorizontal className="size-4" /> Управление меню
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-cream/10 pt-6 text-sm text-cream/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Papito</p>
          <p className="inline-flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0" />
            Демонстрационная версия: заказы и оплата не обрабатываются, данные хранятся только в вашем браузере.
          </p>
        </div>
      </div>
    </footer>
  );
}
