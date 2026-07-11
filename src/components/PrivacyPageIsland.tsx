import { Accent, BootBlock, Cmd, LessViewer } from "./Terminal";
import { SectionHeader } from "./SectionHeader";
import { MotionProvider } from "./MotionProvider";

const MONO_INLINE = { fontFamily: "var(--font-mono)", fontSize: "0.875rem" } as const;
const SECTION_HEADING = { fontWeight: 500, letterSpacing: "-0.01em" } as const;

export function PrivacyPage() {
  return (
    <MotionProvider>
    <div className="space-y-8 max-w-[46rem]">
      <SectionHeader
        level={1}
        number="10"
        label="PRIVACY"
        heading="Privacy"
        meta="last updated: 2026-06"
      />

      {/* Boot */}
      <BootBlock
        lines={[
          {
            status: "OK",
            text: (
              <>
                Loaded <Accent>po4yka.dev/privacy</Accent>
              </>
            ),
          },
          { status: "INFO", text: "No third-party trackers, no ads, no data sold" },
        ]}
      />

      {/* Privacy log */}
      <Cmd>
        cat <Accent>privacy.log</Accent>
      </Cmd>

      <LessViewer filename="privacy.log" meta="5 sections">
        {/* Explicit font-sans override: LessViewer's content wrapper defaults to
            font-mono, and prose-blog would force the serif blog voice — neither
            applies to this page's body copy. */}
        <div className="font-sans space-y-8 text-foreground/80" style={{ fontSize: "0.9375rem", lineHeight: 1.7 }}>

          <section className="space-y-3">
            <h2 className="text-foreground" style={SECTION_HEADING}>Analytics</h2>
            <p>
              This site uses{" "}
              <a href="https://umami.is" className="underline underline-offset-2 hover:text-foreground transition-colors" rel="noopener noreferrer" target="_blank">Umami</a>,
              {" "}a self-hosted, open-source analytics tool running at{" "}
              <span style={MONO_INLINE}>analytics.po4yka.dev</span>. No data leaves the site's own infrastructure. Umami is configured with{" "}
              <span style={MONO_INLINE}>data-do-not-track="true"</span>, which means it honors the browser Do-Not-Track header — visitors with DNT enabled are not counted.
            </p>
            <p>
              As a server-side fallback, the Cloudflare Worker middleware records a single pageview to the same Umami instance when the client-side script is blocked or has not yet run. These server-side events are tagged{" "}
              <span style={MONO_INLINE}>"edge"</span> in the Umami dashboard so the two streams are distinguishable.
            </p>
            <p>
              Umami does not use cookies for analytics. It derives a session signal from a first-party hash of the IP address and user-agent string, which is not stored or linked to any identity. The raw IP address is not retained.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground" style={SECTION_HEADING}>Third-party trackers and advertising</h2>
            <p>There are no third-party trackers, advertising networks, or affiliate scripts on this site. No visitor data is sold, rented, or shared with third parties.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground" style={SECTION_HEADING}>Admin area</h2>
            <p>
              The <span style={MONO_INLINE}>/admin</span> area is secured with WebAuthn passkeys and is excluded from analytics collection entirely. Admin sessions are stored as short-lived tokens in a Cloudflare D1 database and are not visible to site visitors.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground" style={SECTION_HEADING}>Visitor preferences</h2>
            <p>
              Theme, font size, and locale preferences you set via the Settings page are stored in your browser's <span style={MONO_INLINE}>localStorage</span> only. They never leave your device.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground" style={SECTION_HEADING}>Contact</h2>
            <p>
              Questions about data handling can be sent to{" "}
              <a href="mailto:hello@po4yka.dev" className="underline underline-offset-2 hover:text-foreground transition-colors">hello@po4yka.dev</a>.
            </p>
          </section>

        </div>
      </LessViewer>
    </div>
    </MotionProvider>
  );
}
