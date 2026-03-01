import {
  PageContainer,
  Section,
  TextBlock,
} from "@/components/wireframe";
import { DiasporaMap } from "./DiasporaMap";

export function DiasporaSection() {
  return (
    <Section className="relative min-h-[55vh] overflow-hidden bg-surface-inset">
      <DiasporaMap variant="background" />
      <div className="relative z-10 py-8">
        <PageContainer>
          <h2 className="mb-4 text-left font-body text-lg font-semibold uppercase tracking-tight text-primary drop-shadow-sm">
            The Gonsalves Around the World
          </h2>
          <TextBlock>
            <span className="drop-shadow-sm">
              Rooted in Madeira. Grown in Guyana. Connected worldwide.
            </span>
          </TextBlock>
        </PageContainer>
      </div>
    </Section>
  );
}
