import {
  PageContainer,
  Section,
  SectionTitle,
  TextBlock,
  Grid,
  Card,
} from "@/components/wireframe";

const HERITAGE_CARDS = [
  "Portuguese",
  "East Indian",
  "African",
  "Caribbean",
];

export function IdentitySection() {
  return (
    <Section>
      <PageContainer>
        <SectionTitle>Many Roots, One Family</SectionTitle>
        <TextBlock>
          The Gonsalves family carries a rich blend of Portuguese, East
          Indian, African, and Caribbean heritage. These many roots have
          grown together into one family across generations.
        </TextBlock>
        <Grid cols={4}>
          {HERITAGE_CARDS.map((title) => (
            <Card key={title} title={title} />
          ))}
        </Grid>
      </PageContainer>
    </Section>
  );
}
