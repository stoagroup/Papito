"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useData } from "@/lib/store";
import { formatOrderNumber } from "@/lib/format";
import { StatusIcon, statusLabel } from "@/lib/statuses";
import { useUI } from "./AppProviders";

/** Плавающая плашка с последним активным заказом на страницах сайта. */
export function ActiveOrderPill() {
  const pathname = usePathname();
  const data = useData();
  const { cartOpen, checkoutOpen } = useUI();
  if (pathname !== "/" || cartOpen || checkoutOpen) return null;

  const order = data.orders.find((o) => !o.archived && o.status !== "ready");
  if (!order) return null;

  return (
    <Link
      href={`/order/${order.id}`}
      className="fixed bottom-4 left-4 z-40 flex max-w-[calc(100vw-2rem)] animate-pop items-center gap-3 rounded-full bg-ink py-2 pr-4 pl-2 text-cream shadow-sm ring-1 ring-cream/10 transition "
    >
      <span className="flex size-10 shrink-0 animate-pulse-ring items-center justify-center rounded-full bg-orange text-ink">
        <StatusIcon status={order.status} fulfillment={order.fulfillment} className="size-5" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-xs text-cream/55">Заказ {formatOrderNumber(order.number)}</span>
        <span className="block truncate text-sm font-bold">{statusLabel(order.status, order.fulfillment)}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-cream/50" />
    </Link>
  );
}
