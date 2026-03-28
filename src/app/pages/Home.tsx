import { Hero } from "../components/Hero";
import { About } from "../components/About";
import { Links } from "../components/Links";
import { Projects } from "../components/Projects";
import { Experience } from "../components/Experience";
import { BlogPreview } from "../components/BlogPreview";
import { UptimeStrip, SystemBottomBar, MemoryPanel, DiskBars } from "../components/Decorations";
import {
  AdbDevices,
  GradleBuild,
  XcodeSimulators,
  FastlaneDeploy,
  GitLog,
  AdbLogcat,
  SwiftPackageResolve,
  KtlintCheck,
} from "../components/MobileTerminal";

export function Home() {
  return (
    <div className="space-y-14">
      <Hero />
      <About />

      {/* Mobile dev: connected devices */}
      <AdbDevices delay={0.05} />

      <Links />

      {/* Decorative system metrics strip */}
      <UptimeStrip delay={0.05} />

      {/* Mobile dev: Gradle build output */}
      <GradleBuild delay={0.05} />

      <Projects />

      {/* Mobile dev: iOS simulators + SPM resolve side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <XcodeSimulators delay={0.05} />
        <SwiftPackageResolve delay={0.1} />
      </div>

      {/* Decorative memory + disk panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MemoryPanel delay={0.05} />
        <DiskBars delay={0.1} />
      </div>

      <Experience />

      {/* Mobile dev: git log + lint check */}
      <GitLog delay={0.05} />
      <KtlintCheck delay={0.05} />

      <BlogPreview />

      {/* Mobile dev: logcat + fastlane deploy */}
      <AdbLogcat delay={0.05} />
      <FastlaneDeploy delay={0.05} />

      {/* Bottom system bar — network graph + process table */}
      <SystemBottomBar delay={0.05} />
    </div>
  );
}
