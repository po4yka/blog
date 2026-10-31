interface Props {
  thumbSrcs: string[];
  count: number;
  index: number | null;
  openAt: (i: number) => void;
  label: string;
  goToLabel: string;
}

export function Thumbnails({ thumbSrcs, count, index, openAt, label, goToLabel }: Props) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="mt-3 flex max-w-[90vw] flex-wrap items-center justify-center gap-1.5"
    >
      {Array.from({ length: count }).map((_, i) => {
        const src = thumbSrcs[i];
        if (!src) return null;
        const isActive = i === index;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`${goToLabel} ${i + 1}`}
            onClick={() => openAt(i)}
            className="relative h-11 w-14 overflow-hidden rounded-[2px] border transition-opacity duration-150 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px]"
            style={{
              borderColor: isActive ? "var(--emphasis)" : "var(--border)",
              opacity: isActive ? 1 : 0.55,
              outlineColor: "var(--emphasis)",
              background: "var(--card)",
            }}
          >
            {src && (
              <img
                src={src}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="h-full w-full object-cover"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
