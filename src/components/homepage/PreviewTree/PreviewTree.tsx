"use client";

import {
  PageContainer,
  Section,
  TextBlock,
  PlaceholderBox,
  Button,
} from "@/components/wireframe";

/**
 * PreviewTree — preview of the family tree for the homepage.
 * Placeholder for tree visualization.
 */
export function PreviewTree() {
  return (
    <Section>
      <PageContainer narrow>
        <p className="section-subtitle mb-2">Charts</p>
        <h2 className="mb-12 font-heading text-4xl font-semibold tracking-tight text-heading">
          <span className="italic">Family</span> Tree
        </h2>
        <TextBlock>
          Trace the Gonsalves lineage across generations.
        </TextBlock>
        <PlaceholderBox className="mb-4 min-h-64" />
        <Button>Open Full Tree</Button>
      </PageContainer>
    </Section>
  );
}
