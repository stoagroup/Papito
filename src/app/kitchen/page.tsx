import type { Metadata } from "next";
import { KitchenDashboard } from "@/components/KitchenDashboard";

export const metadata: Metadata = { title: "Панель кухни (демо) — Papito" };

export default function KitchenPage() {
  return <KitchenDashboard />;
}
