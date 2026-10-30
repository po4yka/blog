import { stagger } from "@/lib/motion";
import { OutputBlock } from "./Terminal";
import { MotionProvider } from "./MotionProvider";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { useLocale } from "@/stores/settingsStore";

export function About() {
  const { t } = useLocale();

  return (
    <MotionProvider>
    <section id="about" aria-labelledby="about-heading" className="space-y-5">
      <SectionHeader
        number="02"
        label="ABOUT"
        heading={t("about.heading")}
        meta="README.md"
        id="about-heading"
      />
      <OutputBlock delay={0.05}>
        <div
          className="space-y-5 font-sans text-sm text-muted-foreground"
          style={{ lineHeight: 1.8 }}
        >
          <Reveal as="p" speed="slow" delay={0.05}>
            {t("about.p1")}
          </Reveal>
          <Reveal as="p" speed="slow" delay={0.05 + stagger.base}>
            {t("about.p2prefix")}{" "}
            <span className="text-foreground font-medium">
              {t("about.p2kmp")}
            </span>{" "}
            {t("about.p2suffix")}
          </Reveal>
          <Reveal as="p" speed="slow" delay={0.05 + stagger.base * 2}>
            {t("about.p3")}
          </Reveal>
        </div>
      </OutputBlock>
    </section>
    </MotionProvider>
  );
}
