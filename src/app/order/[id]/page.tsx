import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { OrderTracking } from "@/components/OrderTracking";

export const metadata: Metadata = { title: "Статус заказа — Papito" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="min-h-dvh">
        <OrderTracking orderId={id} />
      </main>
    </>
  );
}
