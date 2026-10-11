import Link from "next/link";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-[60dvh] flex-col items-center justify-center bg-white px-4 text-center text-ink">
        <p className="font-display text-5xl font-black text-orange">404</p>
        <h1 className="mt-4 font-display text-2xl font-black">Такой страницы нет в меню</h1>
        <Link href="/" className="mt-8 rounded-lg bg-mustard px-6 py-3.5 font-bold text-ink transition hover:bg-yellow-400">На главную</Link>
      </main>
    </>
  );
}
