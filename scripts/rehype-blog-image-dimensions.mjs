// Build-time rehype plugin: injects width / height attributes on
// <img> elements inside blog-post <picture> blocks so the browser can
// reserve layout space before the image loads and avoid cumulative
// layout shift. Reads PNG dimensions from public/ on disk. Handles PNG
// only (the only format blog posts currently use). Leaves non-PNG and
// missing files untouched.
//
// MDX quirk: raw HTML like <picture>…<img …/></picture> in a .mdx file
// is parsed as JSX, so the AST has mdxJsxFlowElement nodes with
// `attributes` rather than hast `element` nodes with `properties`. We
// handle both shapes so the plugin works whether Astro has already
// lowered the JSX to HTML or not by the time it runs.

import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const PUBLIC_DIR = resolve(process.cwd(), "public");
const dimensionCache = new Map();

function getPngDimensions(publicPath) {
  if (!publicPath.startsWith("/")) return null;
  if (!publicPath.toLowerCase().endsWith(".png")) return null;
  if (dimensionCache.has(publicPath)) return dimensionCache.get(publicPath);

  const diskPath = resolve(PUBLIC_DIR, publicPath.slice(1));
  let buffer;
  try {
    if (!statSync(diskPath).isFile()) {
      dimensionCache.set(publicPath, null);
      return null;
    }
    buffer = readFileSync(diskPath);
  } catch {
    dimensionCache.set(publicPath, null);
    return null;
  }

  // PNG: 8-byte signature, then IHDR chunk. Width at bytes 16-19,
  // height at 20-23, both big-endian uint32.
  if (buffer.length < 24) {
    dimensionCache.set(publicPath, null);
    return null;
  }
  const signature = buffer.toString("hex", 0, 8);
  if (signature !== "89504e470d0a1a0a") {
    dimensionCache.set(publicPath, null);
    return null;
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const dims = { width, height };
  dimensionCache.set(publicPath, dims);
  return dims;
}

function nameOf(node) {
  if (!node || typeof node !== "object") return null;
  if (node.type === "element") return node.tagName;
  if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") return node.name;
  return null;
}

function getAttr(node, attrName) {
  if (node.type === "element" && node.properties) {
    const v = node.properties[attrName];
    return typeof v === "string" ? v : v != null ? String(v) : null;
  }
  if (Array.isArray(node.attributes)) {
    for (const a of node.attributes) {
      if (a && a.type === "mdxJsxAttribute" && a.name === attrName) {
        return typeof a.value === "string" ? a.value : null;
      }
    }
  }
  return null;
}

function hasAttr(node, attrName) {
  if (node.type === "element" && node.properties) {
    return Object.prototype.hasOwnProperty.call(node.properties, attrName);
  }
  if (Array.isArray(node.attributes)) {
    return node.attributes.some(
      (a) => a && a.type === "mdxJsxAttribute" && a.name === attrName,
    );
  }
  return false;
}

function setAttr(node, attrName, value) {
  if (node.type === "element") {
    node.properties = node.properties || {};
    node.properties[attrName] = value;
    return;
  }
  if (!Array.isArray(node.attributes)) node.attributes = [];
  node.attributes.push({
    type: "mdxJsxAttribute",
    name: attrName,
    value: String(value),
  });
}

function visitPictureImgs(node, onHit) {
  if (!node || typeof node !== "object") return;
  if (nameOf(node) === "picture" && Array.isArray(node.children)) {
    for (const child of node.children) {
      if (nameOf(child) === "img") onHit(child);
    }
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) visitPictureImgs(child, onHit);
  }
}

export function rehypeBlogImageDimensions() {
  return (tree) => {
    visitPictureImgs(tree, (img) => {
      if (hasAttr(img, "width") || hasAttr(img, "height")) return;
      const src = getAttr(img, "src");
      if (!src) return;
      const dims = getPngDimensions(src);
      if (!dims) return;
      setAttr(img, "width", dims.width);
      setAttr(img, "height", dims.height);
    });
  };
}
