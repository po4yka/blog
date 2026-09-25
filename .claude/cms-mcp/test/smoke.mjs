// Stdio round-trip against a temp copy of src/content/blog: list, create, reject bad input, delete.
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(packageRoot, "../..");
const root = mkdtempSync(join(tmpdir(), "cms-mcp-"));
cpSync(join(repoRoot, "src/content/blog"), join(root, "src/content/blog"), { recursive: true });

const client = new Client({ name: "cms-smoke", version: "1.0.0" });
const call = async (name, args = {}) => {
  const res = await client.callTool({ name, arguments: args });
  return { isError: Boolean(res.isError), data: JSON.parse(res.content[0].text) };
};

try {
  await client.connect(
    new StdioClientTransport({
      command: "node",
      args: [join(packageRoot, "dist/index.js")],
      env: { ...process.env, PROJECT_ROOT: root },
      stderr: "ignore",
    }),
  );

  const before = (await call("cms_list_posts")).data;
  assert(before.length > 0, "list returns posts from en/ and ru/");
  assert(before.some((p) => p.lang === "en") && before.some((p) => p.lang === "ru"));

  const post = {
    slug: "cms-smoke-test",
    title: "Smoke",
    date: "Apr 2026",
    publishedAt: "2026-04-01",
    summary: "s",
    tags: ["Test"],
    category: "Tooling",
    content: "Body.",
  };
  const created = await call("cms_create_post", post);
  assert(!created.isError, JSON.stringify(created.data));
  const file = join(root, "src/content/blog/en/cms-smoke-test.mdx");
  assert(existsSync(file), "create writes into en/");
  assert(!existsSync(join(root, "src/content/blog/cms-smoke-test.mdx")));
  assert.match(readFileSync(file, "utf8"), /^publishedAt: '2026-04-01'$/m);
  assert((await call("cms_create_post", post)).isError, "duplicate create is rejected");

  const updated = await call("cms_update_post", { slug: "cms-smoke-test", updatedAt: "2026-05-02" });
  assert(!updated.isError, JSON.stringify(updated.data));
  const fm = (await call("cms_get_post", { slug: "cms-smoke-test" })).data.frontmatter;
  assert.equal(fm.publishedAt, "2026-04-01");
  assert.equal(fm.updatedAt, "2026-05-02");

  for (const bad of ["../../../escape", "a/b", "Upper", "", undefined]) {
    assert((await call("cms_create_post", { ...post, slug: bad })).isError, `slug ${bad} rejected`);
    assert((await call("cms_delete_post", { slug: bad })).isError, `delete ${bad} rejected`);
  }
  assert((await call("cms_create_post", { ...post, lang: "../x" })).isError, "bad lang rejected");
  assert((await call("cms_create_post", { ...post, slug: "no-date", publishedAt: "Apr 2026" })).isError);
  assert((await call("cms_create_post", { ...post, slug: "no-date", publishedAt: undefined })).isError);

  assert(!(await call("cms_delete_post", { slug: "cms-smoke-test" })).isError);
  assert(!existsSync(file), "delete removes the file");
  assert.equal((await call("cms_list_posts")).data.length, before.length);

  console.log(`cms-mcp stdio smoke passed (${before.length} posts listed)`);
} finally {
  await client.close().catch(() => {});
  rmSync(root, { recursive: true, force: true });
}
