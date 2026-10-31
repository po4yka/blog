import type { ReactNode } from "react";
import { Em, BootBlock, Cmd, LessViewer } from "./Terminal";
import { SectionHeader } from "./SectionHeader";
import { MotionProvider } from "./MotionProvider";
import { T } from "./ui/T";

const LINK = "underline underline-offset-2 hover:text-foreground transition-colors duration-150";

/** A technical literal (host, attribute, path): mono, never translated. */
const Code = ({ children }: { children: ReactNode }) => <code className="font-mono text-[0.875rem]">{children}</code>;

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3">
    <h2 className="m-0 text-foreground font-medium tracking-[-0.01em]">{title}</h2>
    {children}
  </section>
);

const umami = (
  <a href="https://umami.is" className={LINK} rel="noopener noreferrer" target="_blank">
    Umami
  </a>
);
const mail = (
  <a href="mailto:hello@po4yka.dev" className={LINK}>
    hello@po4yka.dev
  </a>
);

/**
 * The policy in both languages. Both are in the static HTML and html[data-locale]
 * (set before paint) shows one, like `T`, so a Russian visitor never sees the
 * English text first.
 */
function PolicyEn() {
  return (
    <div data-l="en" className="space-y-8">
      <Section title="Analytics">
        <p>
          This site uses {umami}, a self-hosted, open-source analytics tool running at <Code>analytics.po4yka.dev</Code>. No data leaves the site's own infrastructure. Umami is configured with <Code>data-do-not-track="true"</Code>, which means it honors the browser Do-Not-Track header: visitors with DNT enabled are not counted.
        </p>
        <p>
          Umami does not use cookies for analytics. It derives a session signal from a first-party hash of the IP address and user-agent string, which is not stored or linked to any identity. The raw IP address is not retained.
        </p>
      </Section>
      <Section title="Third-party trackers and advertising">
        <p>There are no third-party trackers, advertising networks, or affiliate scripts on this site. No visitor data is sold, rented, or shared with third parties.</p>
      </Section>
      <Section title="Admin area">
        <p>
          The <Code>/admin</Code> area is secured with WebAuthn passkeys and is excluded from analytics collection entirely. Admin sessions are stored as short-lived tokens in a Cloudflare D1 database and are not visible to site visitors.
        </p>
      </Section>
      <Section title="Visitor preferences">
        <p>
          Theme, font size, and locale preferences you set via the Settings page are stored in your browser's <Code>localStorage</Code> only. They never leave your device.
        </p>
      </Section>
      <Section title="Contact">
        <p>Questions about data handling can be sent to {mail}.</p>
      </Section>
    </div>
  );
}

function PolicyRu() {
  return (
    <div data-l="ru" lang="ru" className="space-y-8">
      <Section title="Аналитика">
        <p>
          Сайт использует {umami}, самостоятельно размещённый инструмент аналитики с открытым исходным кодом, который работает на <Code>analytics.po4yka.dev</Code>. Данные не покидают инфраструктуру сайта. Umami настроен с <Code>data-do-not-track="true"</Code>: он учитывает заголовок браузера Do-Not-Track, и посетители с включённым DNT не учитываются.
        </p>
        <p>
          Umami не использует cookie для аналитики. Признак сессии он получает из собственного хеша IP-адреса и строки user-agent; этот хеш не хранится и не связывается с личностью. Исходный IP-адрес не сохраняется.
        </p>
      </Section>
      <Section title="Сторонние трекеры и реклама">
        <p>На сайте нет сторонних трекеров, рекламных сетей и партнёрских скриптов. Данные посетителей не продаются, не сдаются в аренду и не передаются третьим лицам.</p>
      </Section>
      <Section title="Административный раздел">
        <p>
          Раздел <Code>/admin</Code> защищён ключами доступа WebAuthn и полностью исключён из сбора аналитики. Сессии администратора хранятся как краткоживущие токены в базе данных Cloudflare D1 и не видны посетителям сайта.
        </p>
      </Section>
      <Section title="Настройки посетителя">
        <p>
          Тема, размер шрифта и язык, выбранные на странице настроек, хранятся только в <Code>localStorage</Code> вашего браузера и никогда не покидают ваше устройство.
        </p>
      </Section>
      <Section title="Контакты">
        <p>Вопросы об обработке данных можно отправить на {mail}.</p>
      </Section>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <MotionProvider>
    <div className="space-y-8 max-w-[46rem]">
      <SectionHeader
        level={1}
        number="10"
        label="PRIVACY"
        heading={<T k="privacy.heading" />}
        meta={<T k="privacy.lastUpdated" />}
        marks={false}
      />

      {/* Boot */}
      <BootBlock
        lines={[
          {
            status: "OK",
            text: (
              <>
                <T k="terminal.loaded" /> <Em>po4yka.dev/privacy</Em>
              </>
            ),
          },
          { status: "INFO", text: <T k="privacy.noTrackers" /> },
        ]}
      />

      {/* Privacy log */}
      <Cmd>
        cat <Em>privacy.log</Em>
      </Cmd>

      <LessViewer filename="privacy.log" meta={<T k="privacy.sections" />}>
        {/* Explicit font-sans: LessViewer's content wrapper is mono, and
            prose-blog would force the serif blog voice. Neither fits this page. */}
        <div className="font-sans text-foreground/80 text-[0.9375rem] leading-[1.7]">
          <PolicyEn />
          <PolicyRu />
        </div>
      </LessViewer>
    </div>
    </MotionProvider>
  );
}
