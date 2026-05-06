import Link from "next/link";
import { PillarsV3 } from "@/components/homepage/Pillars";

export default function PillarsV3TestPage() {
  return (
    <div className="min-h-screen bg-bg">
      <main className="min-h-screen py-8">
        <p className="px-0 pb-4 text-center text-sm text-muted">
          <Link href="/" className="underline hover:text-text">
            ← Back to home
          </Link>
          {" · "}
          <Link href="/pillars-test" className="underline hover:text-text">
            Pillars (original)
          </Link>
        </p>
        <p className="px-6 pb-6 text-center text-xs text-muted">PillarsV3 — three columns, row gap/padding/margin zero</p>
        <PillarsV3 />
      </main>
    </div>
  );
}
