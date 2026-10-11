import type { Metadata } from "next";
import { AdminPanel, type Tab } from "@/components/admin/AdminPanel";

export const metadata: Metadata = { title: "Управление меню — Papito" };

const TABS: Tab[] = ["products", "categories", "promotions", "settings"];

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const tab = TABS.find((t) => t === sp.tab) ?? "products";
  return <AdminPanel initialTab={tab} openNew={sp.new === "1"} />;
}
