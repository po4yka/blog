import { registerCommand, type Command } from "@/lib/commands";
import { CONTACT_EMAIL } from "@/lib/constants";
import { locales, type Locale } from "@/lib/i18n";
import { getSectionIds } from "@/lib/sections";
import { useSettingsStore } from "@/stores/settingsStore";
import { Em } from "../ui";

const lang: Command = {
  name: "lang",
  description: "Switch the site language",
  completions: (partial) => locales.filter((l) => l.startsWith(partial)),
  execute: (args) => {
    const value = args[0] ?? "";
    const locale = locales.find((l) => l === value);
    if (!locale) return `lang: invalid value "${value}". Use: ${locales.join(", ")}`;
    useSettingsStore.getState().setLocale(locale satisfies Locale);
    return (
      <span>
        Language set to <Em>{locale}</Em>
      </span>
    );
  },
};

const copy: Command = {
  name: "copy",
  description: "Copy a value to the clipboard (copy email)",
  completions: (partial) => ["email"].filter((c) => c.startsWith(partial)),
  execute: (args) => {
    if (args[0] !== "email") return "copy: usage: copy email";
    void navigator.clipboard?.writeText(CONTACT_EMAIL).catch(() => {});
    return (
      <span>
        <Em>{CONTACT_EMAIL}</Em> copied
      </span>
    );
  },
};

const jump: Command = {
  name: "jump",
  description: "Scroll to a section of the current page",
  completions: (partial) => getSectionIds().filter((id) => id.startsWith(partial)),
  execute: (args) => {
    const id = args[0];
    if (!id) return "jump: missing operand. Try: jump projects-heading";
    const el = document.getElementById(id);
    if (!el) return `jump: ${id}: no such section on this page`;
    el.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
    return `Jumped to #${id}`;
  },
};

[lang, copy, jump].forEach(registerCommand);
