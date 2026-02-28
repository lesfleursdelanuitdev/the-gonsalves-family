import {
  PageContainer,
  Section,
  SectionTitle,
  Grid,
  Button,
} from "@/components/wireframe";

const CONTRIBUTE_ACTIONS = ["Add Photo", "Share Story", "Upload Document", "Add Recipe"];

export function ContributeSection() {
  return (
    <Section>
      <PageContainer>
        <SectionTitle>Contribute to the Archive</SectionTitle>
        <Grid cols={4}>
          {CONTRIBUTE_ACTIONS.map((label) => (
            <Button key={label}>{label}</Button>
          ))}
        </Grid>
      </PageContainer>
    </Section>
  );
}
