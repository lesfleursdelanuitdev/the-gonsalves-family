import {
  PageContainer,
  Section,
  ButtonGroup,
  Button,
} from "@/components/wireframe";

export function Hero() {
  return (
    <Section>
      <PageContainer>
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-text mb-4">
            The Gonsalves of Mahaica
          </h1>
          <p className="font-heading text-xl text-muted mb-4 max-w-2xl leading-relaxed">
            From Madeira to Guyana — A Family Across Oceans
          </p>
          <ButtonGroup>
            <Button>Explore Tree</Button>
            <Button>Our Story</Button>
          </ButtonGroup>
        </div>
      </PageContainer>
    </Section>
  );
}
