import { Children, cloneElement, isValidElement, useId, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { Plus, X } from "lucide-react";

type FieldBlockRenderProps = {
  id: string;
  labelId: string;
};

type FieldBlockProps = {
  label: string;
  required?: boolean;
  id?: string;
  asGroup?: boolean;
  children: ReactNode | ((props: FieldBlockRenderProps) => ReactNode);
};

const fieldLabelClassName = "block font-mono text-muted-foreground/60 mb-1.5";
const fieldLabelStyle = {
  fontSize: "0.6875rem",
  letterSpacing: "0.02em",
  fontWeight: 400,
  lineHeight: 1.5,
};

function LabelContent({ label, required }: { label: string; required?: boolean }) {
  return (
    <>
      {label}
      {required && <span className="text-foreground ml-0.5">*</span>}
    </>
  );
}

function canReceiveFieldId(child: ReactNode): child is ReactElement<{ id?: string }> {
  if (Children.count(child) !== 1 || !isValidElement(child)) return false;
  return child.type === "input" || child.type === "select" || child.type === "textarea" || child.type === TagsInput;
}

export function FieldBlock({ label, required, id, asGroup = false, children }: FieldBlockProps) {
  const generatedId = useId();
  const controlId = id ?? `field-${generatedId}`;
  const labelId = `${controlId}-label`;
  const renderedChildren = typeof children === "function" ? children({ id: controlId, labelId }) : children;
  const labelCanTargetControl = !asGroup && (typeof children === "function" || canReceiveFieldId(renderedChildren));
  const associatedChildren = labelCanTargetControl && canReceiveFieldId(renderedChildren)
    ? cloneElement(renderedChildren, { id: renderedChildren.props.id ?? controlId })
    : renderedChildren;

  return (
    <div>
      {labelCanTargetControl ? (
        <label htmlFor={controlId} className={fieldLabelClassName} style={fieldLabelStyle}>
          <LabelContent label={label} required={required} />
        </label>
      ) : (
        <div id={labelId} className={fieldLabelClassName} style={fieldLabelStyle}>
          <LabelContent label={label} required={required} />
        </div>
      )}
      {labelCanTargetControl ? (
        associatedChildren
      ) : (
        <div role="group" aria-labelledby={labelId}>
          {associatedChildren}
        </div>
      )}
    </div>
  );
}

export function TagsInput({ id, tags, onChange, placeholder, label = "Add tag" }: { id?: string; tags: string[]; onChange: (tags: string[]) => void; placeholder: string; label?: string }) {
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
          <button
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            aria-label={`Remove ${tag}`}
            className="inline-flex h-11 w-11 -my-3 -ml-2 -mr-3 items-center justify-center text-muted-foreground/30 hover:text-destructive transition-colors cursor-pointer"
            style={{ fontSize: "0.6875rem", lineHeight: 1 }}
          >
            &times;
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        placeholder={tags.length === 0 ? placeholder : ""}
        aria-label={id ? undefined : label}
        className="flex-1 min-w-[80px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50 font-mono"
        style={{ fontSize: "0.75rem", fontWeight: 400, lineHeight: 1.5 }}
      />
    </div>
  );
}

export function LinksEditor({ links, onChange }: { links: { type: string; href: string }[]; onChange: (links: { type: string; href: string }[]) => void }) {
  const addLink = () => onChange([...links, { type: "GitHub", href: "#" }]);
  const updateLink = (i: number, field: "type" | "href", value: string) => {
    const updated = [...links];
    const existing = updated[i];
    if (existing) updated[i] = { ...existing, [field]: value };
    onChange(updated);
  };
  const removeLink = (i: number) => onChange(links.filter((_, j) => j !== i));

  return (
    <div className="space-y-2">
      {links.map((link, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            aria-label={`Link ${i + 1} type`}
            value={link.type}
            onChange={(e) => updateLink(i, "type", e.target.value)}
            className="w-full sm:w-[130px] px-3 py-2 bg-card border border-border text-foreground outline-none focus:border-border transition-colors duration-200 placeholder:text-muted-foreground/50 shrink-0"
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
            aria-label={`Link ${i + 1} URL`}
            className="w-full px-3 py-2 bg-card border border-border text-foreground outline-none focus:border-border transition-colors duration-200 placeholder:text-muted-foreground/50 flex-1"
            style={{ fontSize: "0.8125rem", borderRadius: "3px", fontWeight: 400, lineHeight: 1.5 }}
          />
          <button
            onClick={() => removeLink(i)}
            aria-label={`Remove link ${i + 1}`}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground/20 hover:text-destructive transition-colors cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      ))}
      <button
        onClick={addLink}
        className="inline-flex items-center gap-1 font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        style={{ fontSize: "0.625rem" }}
      >
        <Plus size={11} />
        Add link
      </button>
    </div>
  );
}
