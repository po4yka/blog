#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { blogTools, handleBlogTool } from "./tools/blog.js";
import { projectTools, handleProjectTool } from "./tools/projects.js";
import { experienceTools, handleExperienceTool } from "./tools/experience.js";
import { regenerateTools, handleRegenerateTool } from "./tools/regenerate.js";

const allTools = [
  ...blogTools,
  ...projectTools,
  ...experienceTools,
  ...regenerateTools,
];

const server = new Server(
  { name: "cms", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const params = (args ?? {}) as Record<string, unknown>;

  try {
    let result: string;

    if (name.startsWith("cms_list_posts") || name.startsWith("cms_get_post") ||
        name.startsWith("cms_create_post") || name.startsWith("cms_update_post") ||
        name.startsWith("cms_delete_post") || name.startsWith("cms_search_posts")) {
      result = handleBlogTool(name, params);
    } else if (name.startsWith("cms_list_projects") || name.startsWith("cms_get_project") ||
               name.startsWith("cms_upsert_project") || name.startsWith("cms_remove_project")) {
      result = handleProjectTool(name, params);
    } else if (name.startsWith("cms_list_experience") || name.startsWith("cms_upsert_role") ||
               name.startsWith("cms_remove_role") || name.startsWith("cms_update_skills")) {
      result = handleExperienceTool(name, params);
    } else if (name === "cms_regenerate") {
      result = handleRegenerateTool(name);
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: "text", text: result }],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: JSON.stringify({ error: message }) }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CMS MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
