// Import all command modules to trigger registration
import "./builtin";
import "./ls";
import "./cat";
import "./open";
import "./grep";
import "./theme";
import "./neofetch";
import "./history";

// Re-export registry API
export { getCommand, getAllCommands, getCommandNames } from "./registry";
export type { Command, CommandContext } from "./types";
