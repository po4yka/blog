import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageRoots = [
  ".claude/accesslint-mcp",
  ".claude/cms-mcp",
];

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function dependencyModuleUrl(packageRoot, modulePath) {
  return pathToFileURL(resolve(packageRoot, "node_modules", modulePath)).href;
}

async function verifyPackage(relativePackageRoot) {
  const packageRoot = resolve(repositoryRoot, relativePackageRoot);
  const manifest = await readJson(resolve(packageRoot, "package.json"));
  const nodeServerManifest = await readJson(
    resolve(packageRoot, "node_modules/@hono/node-server/package.json"),
  );

  assert.equal(
    manifest.dependencies?.["@hono/node-server"],
    "2.0.12",
    `${relativePackageRoot} must declare @hono/node-server 2.0.12 directly`,
  );
  assert.equal(
    manifest.overrides?.["@hono/node-server"],
    "2.0.12",
    `${relativePackageRoot} must apply 2.0.12 to the SDK dependency`,
  );
  assert.equal(manifest.engines?.node, ">=20");
  assert.equal(nodeServerManifest.version, "2.0.12");

  const [{ McpServer }, { StreamableHTTPServerTransport }, { Client }, clientTransportModule] =
    await Promise.all([
      import(
        dependencyModuleUrl(
          packageRoot,
          "@modelcontextprotocol/sdk/dist/esm/server/mcp.js",
        )
      ),
      import(
        dependencyModuleUrl(
          packageRoot,
          "@modelcontextprotocol/sdk/dist/esm/server/streamableHttp.js",
        )
      ),
      import(
        dependencyModuleUrl(
          packageRoot,
          "@modelcontextprotocol/sdk/dist/esm/client/index.js",
        )
      ),
      import(
        dependencyModuleUrl(
          packageRoot,
          "@modelcontextprotocol/sdk/dist/esm/client/streamableHttp.js",
        )
      ),
    ]);

  const mcpServer = new McpServer({
    name: "node-server-v2-smoke",
    version: "1.0.0",
  });
  mcpServer.registerTool(
    "ping",
    { description: "Verify MCP over HTTP", inputSchema: {} },
    async () => ({ content: [{ type: "text", text: "pong" }] }),
  );

  const serverTransport = new StreamableHTTPServerTransport({
    sessionIdGenerator: randomUUID,
  });
  const httpServer = createServer((request, response) => {
    void serverTransport.handleRequest(request, response);
  });
  const client = new Client({
    name: "node-server-v2-client",
    version: "1.0.0",
  });

  try {
    await mcpServer.connect(serverTransport);
    httpServer.listen(0, "127.0.0.1");
    await once(httpServer, "listening");

    const address = httpServer.address();
    assert(address && typeof address === "object");
    const clientTransport = new clientTransportModule.StreamableHTTPClientTransport(
      new URL(`http://127.0.0.1:${address.port}/mcp`),
    );

    await client.connect(clientTransport);
    const tools = await client.listTools();
    assert.deepEqual(
      tools.tools.map((tool) => tool.name),
      ["ping"],
    );

    const result = await client.callTool({ name: "ping", arguments: {} });
    assert.deepEqual(result.content, [{ type: "text", text: "pong" }]);
  } finally {
    await client.close().catch(() => {});
    await mcpServer.close().catch(() => {});
    if (httpServer.listening) {
      await new Promise((resolveClose, rejectClose) => {
        httpServer.close((error) => {
          if (error) rejectClose(error);
          else resolveClose();
        });
      });
    }
  }

  console.log(`${relativePackageRoot}: MCP HTTP compatibility passed`);
}

for (const packageRoot of packageRoots) {
  await verifyPackage(packageRoot);
}
