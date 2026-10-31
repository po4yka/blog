import { stagger } from "@/lib/motion";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { T } from "./ui/T";

/** Server-only (no client directive): static HTML with both languages, no JS. */
export function About() {
  return (
    <section id="about" aria-labelledby="about-heading" className="space-y-5">
      <SectionHeader
        number="02"
        label="ABOUT"
        heading={<T k="about.heading" />}
        meta="README.md"
        id="about-heading"
      />
      <Reveal
        speed="slow"
        delay={0.05}
        className="relative pl-6 md:pl-8 font-mono"
        style={{ borderLeft: "1px solid var(--rule)" }}
      >
        <div
          className="space-y-5 font-sans text-sm text-muted-foreground"
          style={{ lineHeight: 1.8 }}
        >
          <Reveal as="p" speed="slow" delay={0.05}>
            <T k="about.p1" />
          </Reveal>
          <Reveal as="p" speed="slow" delay={0.05 + stagger.base}>
            <T k="about.p2prefix" />{" "}
            <span className="text-foreground font-medium">
              <T k="about.p2kmp" />
            </span>{" "}
            <T k="about.p2suffix" />
          </Reveal>
          <Reveal as="p" speed="slow" delay={0.05 + stagger.base * 2}>
            <T k="about.p3" />
          </Reveal>
        </div>
      </Reveal>
    </section>
  );
}
