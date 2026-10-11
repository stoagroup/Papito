"use client";

import Link from "next/link";
import { ArrowRight, BadgePercent, Gift, Package, Settings2, ShoppingBag, Sun } from "lucide-react";
import { addToCart, useData, useHydrated } from "@/lib/store";
import { findPromo, getCombo, getDailyDeal } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import { useUI } from "./AppProviders";
import { FoodImage, Reveal, SectionTitle } from "./ui";

function goToMenu() {
  document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
}

function SetupLink({ text }: { text: string }) {
  return (
    <Link
      href="/admin?tab=promotions"
      className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-5 py-3 text-sm font-bold text-cream transition hover:border-cream/60 hover:bg-cream/10"
    >
      <Settings2 className="size-4" /> {text}
    </Link>
  );
}

function Inactive() {
  return <p className="rounded-2xl bg-cream/10 px-4 py-3 text-sm font-semibold text-cream/70">Сейчас акция не проводится — следите за обновлениями.</p>;
}

export function Promotions() {
  const data = useData();
  const hydrated = useHydrated();
  const { setMenuFocus, toast } = useUI();
  const combo = getCombo(data);
  const deal = getDailyDeal(data);
  const daily = findPromo(data, "daily");
  const first = findPromo(data, "first-order");

  const cardBase = "group relative flex h-full flex-col overflow-hidden rounded-[32px] bg-ink text-cream shadow-[0_30px_60px_-30px_rgb(20_13_10/0.7)]";

  return (
    <section id="promo" className="relative overflow-hidden bg-cream-2 py-20 sm:py-28">
      <div className="pointer-events-none absolute -top-40 right-0 size-[500px] rounded-full bg-orange/15 blur-[100px]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle eyebrow="Акции" title={<>Выгоднее, <span className="text-brand">чем кажется</span></>} text="Честные предложения без таймеров и звёздочек мелким шрифтом." />

        <div className={`mt-12 grid gap-5 lg:grid-cols-2 ${hydrated ? "" : "opacity-0"}`}>
          {/* Комбо */}
          {combo && (
            <Reveal className="lg:row-span-2">
              <article className={`${cardBase} min-h-[520px]`}>
                <div className="relative h-64 shrink-0 overflow-hidden sm:h-80 lg:h-[56%]">
                  <FoodImage src={combo.promo.image} alt={combo.promo.title} className="size-full transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
                  <span className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full bg-mustard px-4 py-2 text-xs font-extrabold tracking-wide text-ink uppercase">
                    <Package className="size-4" /> Комбо
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <h3 className="font-display text-2xl leading-tight font-black sm:text-3xl">{combo.promo.title}</h3>
                  <p className="mt-3 text-cream/65">{combo.promo.description}</p>
                  {!combo.promo.active ? (
                    <div className="mt-auto pt-6"><Inactive /></div>
                  ) : combo.ready ? (
                    <>
                      <ul className="mt-5 flex flex-wrap gap-2">
                        {combo.products.map((p) => (
                          <li key={p.id} className="rounded-full bg-cream/10 px-3 py-1.5 text-sm font-semibold">{p.name}</li>
                        ))}
                      </ul>
                      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-7">
                        <div className="leading-none">
                          {combo.regular > combo.price && <div className="mb-1.5 text-cream/45 line-through">{formatPrice(combo.regular)}</div>}
                          <div className="font-display text-4xl font-black text-mustard">{formatPrice(combo.price)}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuFocus({ ids: combo.products.map((p) => p.id), label: "Состав комбо" });
                              goToMenu();
                            }}
                            className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-5 py-3 text-sm font-bold transition hover:border-cream/60"
                          >
                            Смотреть блюда
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              addToCart("combo", combo.promo.id);
                              toast("Комбо добавлено в корзину");
                            }}
                            className="inline-flex items-center gap-2 rounded-full bg-orange px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#ff8a2e]"
                          >
                            <ShoppingBag className="size-4" /> В корзину
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mt-auto space-y-4 pt-6">
                      <p className="text-sm text-cream/55">Набор пока не собран: выберите минимум две позиции меню и задайте специальную цену.</p>
                      <SetupLink text="Собрать комбо" />
                    </div>
                  )}
                </div>
              </article>
            </Reveal>
          )}

          {/* Скидка на первый заказ */}
          {first && (
            <Reveal delay={100}>
              <article className={`${cardBase} sm:flex-row`}>
                <div className="relative h-52 shrink-0 overflow-hidden sm:h-auto sm:w-2/5">
                  <FoodImage src={first.image} alt={first.title} className="size-full transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-ink/40" />
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand px-3 py-1.5 text-xs font-extrabold tracking-wide uppercase">
                    <Gift className="size-4" /> Новым гостям
                  </span>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="font-display text-5xl font-black text-mustard">−{first.discountPercent}%</span>
                  </div>
                  <h3 className="mt-2 font-display text-xl leading-tight font-bold">{first.title}</h3>
                  <p className="mt-2 text-sm text-cream/60">{first.description}</p>
                  <div className="mt-auto pt-5">
                    {first.active && first.discountPercent > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuFocus(null);
                          goToMenu();
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-orange px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#ff8a2e]"
                      >
                        Выбрать блюда <ArrowRight className="size-4" />
                      </button>
                    ) : (
                      <Inactive />
                    )}
                  </div>
                </div>
              </article>
            </Reveal>
          )}

          {/* Предложение дня */}
          {daily && (
            <Reveal delay={200}>
              <article className={`${cardBase} sm:flex-row`}>
                <div className="relative h-52 shrink-0 overflow-hidden sm:h-auto sm:w-2/5">
                  <FoodImage src={deal?.product.image || daily.image} alt={deal?.product.name ?? daily.title} className="size-full transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-ink/40" />
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-mustard px-3 py-1.5 text-xs font-extrabold tracking-wide text-ink uppercase">
                    <Sun className="size-4" /> {daily.title}
                  </span>
                  {deal ? (
                    <>
                      <h3 className="mt-4 font-display text-xl leading-tight font-bold break-words">{deal.product.name}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-cream/60">{deal.product.description || daily.description}</p>
                      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
                        <div className="leading-none">
                          <div className="mb-1 text-sm text-cream/45 line-through">{formatPrice(deal.product.price)}</div>
                          <div className="flex items-center gap-2 font-display text-3xl font-black text-mustard">
                            {formatPrice(Math.round(deal.product.price * (1 - daily.discountPercent / 100)))}
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-1 font-sans text-xs text-white">
                              <BadgePercent className="size-3.5" />−{daily.discountPercent}%
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuFocus({ ids: [deal.product.id], label: "Предложение дня" });
                            goToMenu();
                          }}
                          className="inline-flex items-center gap-2 rounded-full bg-orange px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#ff8a2e]"
                        >
                          К блюду <ArrowRight className="size-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="mt-4 font-display text-xl leading-tight font-bold">Скидка {daily.discountPercent}% на одну позицию</h3>
                      <p className="mt-2 text-sm text-cream/60">{daily.active ? "Позиция дня ещё не выбрана — назначьте её в панели управления." : "Сегодня предложение дня не действует."}</p>
                      {daily.active && <div className="mt-auto pt-5"><SetupLink text="Выбрать позицию дня" /></div>}
                    </>
                  )}
                </div>
              </article>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
