import {
  PageContainer,
  Section,
  SectionTitle,
  PlaceholderBox,
  TextBlock,
} from "@/components/wireframe";

export function DiasporaSection() {
  return (
    <Section>
      <PageContainer>
        <SectionTitle>The Gonsalves Around the World</SectionTitle>
        <PlaceholderBox aspectRatio="16/9" className="mb-4" />
        <TextBlock>Rooted in Madeira. Grown in Guyana. Connected worldwide.</TextBlock>
      </PageContainer>
    </Section>
  );
}
