import { registerCommand } from "./registry";
import type { Command } from "./types";

const history: Command = {
  name: "history",
  description: "Show command history",
  execute: (_args, ctx) => {
    if (ctx.history.length === 0) {
      return "No commands in history";
    }

    return (
      <div className="space-y-0">
        {ctx.history.map((cmd, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-muted-foreground/30 shrink-0" style={{ minWidth: 24 }}>
              {i + 1}
            </span>
            <span className="text-foreground/60">{cmd}</span>
          </div>
        ))}
      </div>
    );
  },
};

registerCommand(history);
