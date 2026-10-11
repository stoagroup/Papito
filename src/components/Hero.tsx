import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Beef, Flame, Leaf, Timer } from "lucide-react";

const advantages = [
  { icon: Leaf, title: "Свежие продукты", text: "Овощи режем каждое утро, мясо и курицу маринуем сами — никаких заготовок на неделю." },
  { icon: Timer, title: "Быстрое приготовление", text: "Собираем заказ сразу после оформления: гриль, сборка и упаковка без лишнего ожидания." },
  { icon: Beef, title: "Большие порции", text: "Готовим так, чтобы наесться одним заказом. Начинки не жалеем — это наш принцип." },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-black text-cream">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 -left-40 size-[520px] rounded-full bg-brand/35 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 size-[480px] rounded-full bg-orange/20 blur-[120px]" />
        <div className="grain absolute inset-0 opacity-60" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 pt-28 pb-12 sm:px-6 lg:min-h-[88vh] lg:grid-cols-[1fr_1.15fr] lg:pt-24 lg:pb-16">
        <div className="animate-fade-up">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-mustard/30 bg-mustard/10 px-4 py-1.5 text-xs font-bold tracking-wide text-mustard uppercase">
            <Flame className="size-4" /> Гриль · бургеры · роллы
          </p>
          <h1 className="font-display text-[2.6rem] leading-[0.98] font-black tracking-tight text-balance sm:text-6xl xl:text-7xl">
            Вкус, который <span className="text-orange">невозможно</span> забыть
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/70">
            Свежие ингредиенты, сочное мясо с гриля и хрустящая картошка — готовим каждый заказ с нуля и отдаём горячим, пока вы не успели заскучать.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="#menu"
              className="group inline-flex animate-pulse-ring items-center gap-3 rounded-full bg-orange py-4 pr-4 pl-7 text-lg font-extrabold text-white transition hover:bg-[#ff8a2e]"
            >
              Сделать заказ
              <span className="flex size-9 items-center justify-center rounded-full bg-white/20 transition group-hover:translate-x-1">
                <ArrowRight className="size-5" />
              </span>
            </Link>
            <Link href="#promo" className="rounded-full px-5 py-4 font-bold text-cream/80 underline-offset-4 transition hover:text-cream hover:underline">
              Смотреть акции
            </Link>
          </div>
        </div>

        <div className="relative animate-fade-up [animation-delay:150ms]">
          <div className="relative aspect-[1175/760] w-full lg:scale-110">
            <Image
              src="/images/spread-dark.jpg"
              alt="Фирменный бургер Papito, роллы, курица на шпажках, картофель фри и напитки"
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-contain [mask-image:radial-gradient(ellipse_at_center,black_62%,transparent_100%)]"
            />
            <div className="absolute top-[2%] left-[30%] hidden animate-float items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm font-extrabold text-ink shadow-2xl sm:flex">
              <span className="size-2 rounded-full bg-brand" /> Фирменный бургер
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-cream/10 bg-ink-2/80 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-px px-4 sm:px-6 md:grid-cols-3">
          {advantages.map((a, i) => (
            <div key={a.title} className="flex animate-fade-up gap-4 py-7 md:px-6 md:first:pl-0" style={{ animationDelay: `${250 + i * 100}ms` }}>
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange to-brand text-white shadow-lg">
                <a.icon className="size-6" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold">{a.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-cream/60">{a.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
