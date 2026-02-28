import {
  PageContainer,
  Section,
  SectionTitle,
  TextBlock,
  PlaceholderBox,
  Button,
} from "@/components/wireframe";

export function TreePreview() {
  return (
    <Section>
      <PageContainer>
        <SectionTitle>Family Tree</SectionTitle>
        <TextBlock>
          Trace the Gonsalves lineage across generations.
        </TextBlock>
        <PlaceholderBox className="mb-4 min-h-64" />
        <Button>Open Full Tree</Button>
      </PageContainer>
    </Section>
  );
}
