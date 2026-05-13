import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { ContributeView } from "@/components/contribute/ContributeView";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  individualXref?: string;
  individualName?: string;
}>;

export default async function ContributePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <ContributeView
        relatedIndividualXref={sanitizeParam(sp.individualXref, 50)}
        relatedIndividualName={sanitizeParam(sp.individualName, 255)}
      />
    </div>
  );
}

function sanitizeParam(value: string | undefined, max: number) {
  const cleaned = value?.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
  return cleaned || null;
}
