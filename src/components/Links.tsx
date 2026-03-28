import { motion } from "motion/react";
import { useInView } from "./useInView";
import { Cmd, Accent } from "./Terminal";
import { MotionProvider } from "./MotionProvider";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const links = [
  { icon: "✉", label: "email", href: "mailto:hello@po4yka.dev" },
  { icon: "⊞", label: "google play", href: "#" },
  { icon: "◉", label: "linkedin", href: "#" },
  { icon: "⌘", label: "github", href: "https://github.com/po4yka" },
  { icon: "✈", label: "telegram", href: "#" },
];

export function Links() {
  const { ref, inView } = useInView(0.1);

  return (
    <MotionProvider>
    <section className="space-y-5">
      <Cmd>
        cat <Accent>~/.config/links.toml</Accent>
      </Cmd>

      <motion.div
        ref={ref}
        className="flex flex-wrap gap-2 pl-4 md:pl-6"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, ease }}
      >
        {links.map((link, i) => (
          <motion.a
            key={link.label}
            href={link.href}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-foreground/60 hover:text-accent hover:bg-accent/5 transition-all duration-250 font-mono text-mono rounded-[6px]"
            style={{
              border: "1px solid var(--border)",
            }}
            initial={{ opacity: 0, y: 6 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.3, delay: 0.05 + i * 0.04, ease }}
            whileHover={{
              y: -2,
              borderColor: "var(--accent)",
              transition: { type: "spring", stiffness: 400, damping: 20 },
            }}
            whileTap={{
              scale: 0.95,
              transition: { type: "spring", stiffness: 500, damping: 15 },
            }}
          >
            <motion.span
              className="text-muted-foreground/35 text-mono-sm"
              whileHover={{ scale: 1.2, rotate: 10 }}
            >
              {link.icon}
            </motion.span>
            {link.label}
          </motion.a>
        ))}
      </motion.div>
    </section>
    </MotionProvider>
  );
}
