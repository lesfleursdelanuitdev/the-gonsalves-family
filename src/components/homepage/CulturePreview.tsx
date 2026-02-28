import {
  PageContainer,
  Section,
  SectionTitle,
  Grid,
  Card,
} from "@/components/wireframe";

export function CulturePreview() {
  return (
    <Section>
      <PageContainer>
        <SectionTitle>Family Culture</SectionTitle>
        <Grid cols={2}>
          <Card title="Recipes" />
          <Card title="Language" />
        </Grid>
      </PageContainer>
    </Section>
  );
}
