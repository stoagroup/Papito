import Image from "next/image";
import { Flame, HeartHandshake, Sandwich, ShieldCheck } from "lucide-react";
import { Reveal, SectionTitle } from "./ui";

const points = [
  { icon: Flame, title: "Открытый гриль", text: "Мясо и курицу жарим при вас, без разогрева и микроволновок." },
  { icon: Sandwich, title: "Собираем на заказ", text: "Каждое блюдо собирается после оформления, а не ждёт под лампой." },
  { icon: ShieldCheck, title: "Чистая кухня", text: "Раздельные зоны для сырых и готовых продуктов, ежедневный контроль." },
  { icon: HeartHandshake, title: "Как для своих", text: "Papito — это «папочка»: готовим так, как кормили бы семью." },
];

export function About() {
  return (
    <section id="about" className="relative overflow-hidden bg-ink py-20 text-cream sm:py-28">
      <div className="grain pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal className="relative order-2 lg:order-1">
          <div className="relative mx-auto grid max-w-lg grid-cols-2 gap-4">
            <div className="relative mt-12 aspect-square overflow-hidden rounded-full ring-4 ring-cream/10">
              <Image src="/images/open-chicken.jpg" alt="Курица с гриля, томаты, салат и сыр на тонкой лепёшке" fill sizes="(min-width: 1024px) 260px, 45vw" className="object-cover transition duration-700 hover:scale-110" />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-full ring-4 ring-cream/10">
              <Image src="/images/open-assorted.jpg" alt="Шампиньоны, ветчина, курица и сыр на тонкой лепёшке" fill sizes="(min-width: 1024px) 260px, 45vw" className="object-cover transition duration-700 hover:scale-110" />
            </div>
            <div className="col-span-2 -mt-6 overflow-hidden rounded-[28px] ring-4 ring-cream/10">
              <div className="relative aspect-[16/8]">
                <Image src="/images/spread-light.jpg" alt="Бургер, роллы, шашлычки, наггетсы и картофель фри" fill sizes="(min-width: 1024px) 520px, 90vw" className="object-cover transition duration-700 hover:scale-105" />
              </div>
            </div>
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <SectionTitle
            light
            eyebrow="О нас"
            title={<>Стритфуд, который <span className="text-mustard">не стыдно</span> любить</>}
            text="Papito начинался с простой идеи: быстрая еда может быть честной. Свежие овощи, собственные маринады, щедрые начинки и кухня, которую не нужно прятать от гостей."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {points.map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <div className="h-full rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 transition hover:border-orange/40 hover:bg-cream/[0.07]">
                  <p.icon className="size-7 text-orange" />
                  <h3 className="mt-3 font-display font-bold">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-cream/60">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
