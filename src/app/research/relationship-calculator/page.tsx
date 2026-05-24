import type { Metadata } from "next";
import { ResearchPageShell } from "@/components/research/ResearchPageShell";
import { RelationshipCalculator } from "@/components/research/RelationshipCalculator";

export const metadata: Metadata = {
  title: "Relationship calculator · Research · The Gonsalves Family",
  description: "Find out how any two people in the Gonsalves family tree are related.",
};

export default function RelationshipCalculatorPage() {
  return (
    <ResearchPageShell
      title="Relationship calculator"
      description="Select two people from the tree to find out how they are related."
    >
      <RelationshipCalculator />
    </ResearchPageShell>
  );
}
