import {
  PageContainer,
  Section,
  SectionTitle,
  Grid,
  PlaceholderBox,
  Button,
} from "@/components/wireframe";

export function ArchivePreview() {
  return (
    <Section>
      <PageContainer>
        <SectionTitle>The Gonsalves Archive</SectionTitle>
        <div className="mb-4">
        <Grid cols={6}>
          {Array.from({ length: 6 }).map((_, i) => (
            <PlaceholderBox key={i} aspectRatio="1" />
          ))}
        </Grid>
        </div>
        <Button>Explore Archive</Button>
      </PageContainer>
    </Section>
  );
}
