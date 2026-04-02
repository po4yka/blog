import { useState } from "react";
import { Plus, X } from "lucide-react";

export function FieldBlock({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-muted-foreground/60 mb-1.5" style={{ fontSize: "0.6875rem", letterSpacing: "0.02em", fontWeight: 400, lineHeight: 1.5 }}>
        {label}{required && <span className="text-accent ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function TagsInput({ tags, onChange, placeholder, label = "Add tag" }: { tags: string[]; onChange: (tags: string[]) => void; placeholder: string; label?: string }) {
  const [input, setInput] = useState("");

  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput("");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-card border border-border/50 min-h-[38px]" style={{ borderRadius: "3px" }}>
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 font-mono px-2 py-0.5 bg-secondary/80 text-foreground/60 border border-border/40" style={{ fontSize: "0.625rem", borderRadius: "2px" }}>
          {tag}
          <button onClick={() => onChange(tags.filter((t) => t !== tag))} className="text-muted-foreground/30 hover:text-destructive transition-colors cursor-pointer ml-0.5" style={{ fontSize: "0.6875rem", lineHeight: 1 }}>
            &times;
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        placeholder={tags.length === 0 ? placeholder : ""}
        aria-label={label}
        className="flex-1 min-w-[80px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground/20 font-mono"
        style={{ fontSize: "0.75rem", fontWeight: 400, lineHeight: 1.5 }}
      />
    </div>
  );
}

export function LinksEditor({ links, onChange }: { links: { type: string; href: string }[]; onChange: (links: { type: string; href: string }[]) => void }) {
  const addLink = () => onChange([...links, { type: "GitHub", href: "#" }]);
  const updateLink = (i: number, field: "type" | "href", value: string) => {
    const updated = [...links];
    updated[i] = { ...updated[i]!, [field]: value };
    onChange(updated);
  };
  const removeLink = (i: number) => onChange(links.filter((_, j) => j !== i));

  return (
    <div className="space-y-2">
      {links.map((link, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            value={link.type}
            onChange={(e) => updateLink(i, "type", e.target.value)}
            className="w-full sm:w-[130px] px-3 py-2 bg-card border border-border text-foreground outline-none focus:border-accent/40 transition-colors duration-200 placeholder:text-muted-foreground/30 shrink-0"
            style={{ fontSize: "0.8125rem", borderRadius: "3px", fontWeight: 400, lineHeight: 1.5, cursor: "pointer" }}
          >
            <option>GitHub</option>
            <option>Google Play</option>
            <option>App Store</option>
            <option>Website</option>
          </select>
          <input
            type="text"
            value={link.href}
            onChange={(e) => updateLink(i, "href", e.target.value)}
            placeholder="URL"
            className="w-full px-3 py-2 bg-card border border-border text-foreground outline-none focus:border-accent/40 transition-colors duration-200 placeholder:text-muted-foreground/30 flex-1"
            style={{ fontSize: "0.8125rem", borderRadius: "3px", fontWeight: 400, lineHeight: 1.5 }}
          />
          <button onClick={() => removeLink(i)} className="text-muted-foreground/20 hover:text-destructive transition-colors cursor-pointer p-1">
            <X size={13} />
          </button>
        </div>
      ))}
      <button
        onClick={addLink}
        className="inline-flex items-center gap-1 font-mono text-muted-foreground/30 hover:text-accent transition-colors cursor-pointer"
        style={{ fontSize: "0.625rem" }}
      >
        <Plus size={11} />
        Add link
      </button>
    </div>
  );
}
