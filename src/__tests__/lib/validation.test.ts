import { describe, it, expect } from "vitest";
import {
  blogPostSchema,
  projectSchema,
  projectLinkSchema,
  roleSchema,
  siteSettingsSchema,
  categorySchema,
  loginSchema,
  validationError,
} from "@/lib/validation";

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------
describe("loginSchema", () => {
  it("accepts a non-empty password", () => {
    expect(() => loginSchema.parse({ password: "secret" })).not.toThrow();
  });

  it("rejects an empty password", () => {
    expect(() => loginSchema.parse({ password: "" })).toThrow();
  });

  it("rejects missing password", () => {
    expect(() => loginSchema.parse({})).toThrow();
  });
});

// ---------------------------------------------------------------------------
// projectLinkSchema
// ---------------------------------------------------------------------------
describe("projectLinkSchema", () => {
  it("accepts valid link", () => {
    const result = projectLinkSchema.parse({ type: "github", href: "https://github.com/test" });
    expect(result).toEqual({ type: "github", href: "https://github.com/test" });
  });

  it("rejects missing type", () => {
    expect(() => projectLinkSchema.parse({ href: "https://github.com" })).toThrow();
  });

  it("rejects missing href", () => {
    expect(() => projectLinkSchema.parse({ type: "github" })).toThrow();
  });

  it("rejects empty object", () => {
    expect(() => projectLinkSchema.parse({})).toThrow();
  });

  it("rejects empty href (URL validation required)", () => {
    expect(() => projectLinkSchema.parse({ type: "github", href: "" })).toThrow();
  });

  it("accepts empty type string", () => {
    expect(() => projectLinkSchema.parse({ type: "", href: "https://example.com" })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// blogPostSchema
// ---------------------------------------------------------------------------
describe("blogPostSchema", () => {
  const validPost = {
    slug: "my-first-post",
    title: "My First Post",
    date: "Jan 2025",
    summary: "A short summary",
    tags: ["typescript", "vitest"],
    category: "Engineering",
    content: "# Hello World",
    featured: true,
    readingTime: 5,
  };

  it("accepts a fully populated valid post", () => {
    const result = blogPostSchema.parse(validPost);
    expect(result.slug).toBe("my-first-post");
    expect(result.featured).toBe(true);
    expect(result.readingTime).toBe(5);
  });

  it("accepts a minimal post (optional fields omitted)", () => {
    const { featured, readingTime, ...minimal } = validPost;
    void featured; void readingTime;
    const result = blogPostSchema.parse(minimal);
    expect(result.featured).toBeUndefined();
    expect(result.readingTime).toBeUndefined();
  });

  it("rejects empty slug", () => {
    expect(() => blogPostSchema.parse({ ...validPost, slug: "" })).toThrow();
  });

  it("rejects empty title", () => {
    expect(() => blogPostSchema.parse({ ...validPost, title: "" })).toThrow();
  });

  it("rejects empty date", () => {
    expect(() => blogPostSchema.parse({ ...validPost, date: "" })).toThrow();
  });

  it("rejects missing slug", () => {
    const { slug, ...rest } = validPost;
    void slug;
    expect(() => blogPostSchema.parse(rest)).toThrow();
  });

  it("rejects non-array tags", () => {
    expect(() => blogPostSchema.parse({ ...validPost, tags: "typescript" })).toThrow();
  });

  it("rejects non-boolean featured", () => {
    expect(() => blogPostSchema.parse({ ...validPost, featured: 1 })).toThrow();
  });

  it("rejects non-number readingTime", () => {
    expect(() => blogPostSchema.parse({ ...validPost, readingTime: "five" })).toThrow();
  });

  it("accepts empty arrays for tags", () => {
    const result = blogPostSchema.parse({ ...validPost, tags: [] });
    expect(result.tags).toEqual([]);
  });

  it("accepts empty string for summary and content", () => {
    const result = blogPostSchema.parse({ ...validPost, summary: "", content: "" });
    expect(result.summary).toBe("");
    expect(result.content).toBe("");
  });
});

// ---------------------------------------------------------------------------
// projectSchema
// ---------------------------------------------------------------------------
describe("projectSchema", () => {
  const validProject = {
    id: "proj-1",
    name: "My App",
    description: "An awesome app",
    platforms: ["android", "ios"],
    tags: ["kotlin", "swift"],
    links: [{ type: "github", href: "https://github.com/test" }],
    featured: true,
    sortOrder: 0,
  };

  it("accepts a fully populated valid project", () => {
    const result = projectSchema.parse(validProject);
    expect(result.name).toBe("My App");
    expect(result.platforms).toEqual(["android", "ios"]);
  });

  it("accepts project without optional id", () => {
    const { id, ...rest } = validProject;
    void id;
    const result = projectSchema.parse(rest);
    expect(result.id).toBeUndefined();
  });

  it("accepts project without optional featured and sortOrder", () => {
    const { featured, sortOrder, ...rest } = validProject;
    void featured; void sortOrder;
    const result = projectSchema.parse(rest);
    expect(result.featured).toBeUndefined();
    expect(result.sortOrder).toBeUndefined();
  });

  it("rejects empty name", () => {
    expect(() => projectSchema.parse({ ...validProject, name: "" })).toThrow();
  });

  it("rejects missing name", () => {
    const { name, ...rest } = validProject;
    void name;
    expect(() => projectSchema.parse(rest)).toThrow();
  });

  it("rejects non-array platforms", () => {
    expect(() => projectSchema.parse({ ...validProject, platforms: "android" })).toThrow();
  });

  it("rejects non-array tags", () => {
    expect(() => projectSchema.parse({ ...validProject, tags: null })).toThrow();
  });

  it("rejects invalid link shape in links array", () => {
    expect(() => projectSchema.parse({ ...validProject, links: [{ url: "bad" }] })).toThrow();
  });

  it("rejects non-boolean featured", () => {
    expect(() => projectSchema.parse({ ...validProject, featured: 1 })).toThrow();
  });

  it("accepts empty arrays", () => {
    const result = projectSchema.parse({ ...validProject, platforms: [], tags: [], links: [] });
    expect(result.platforms).toEqual([]);
    expect(result.tags).toEqual([]);
    expect(result.links).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// roleSchema
// ---------------------------------------------------------------------------
describe("roleSchema", () => {
  const validRole = {
    id: "role-1",
    period: "2023 - Present",
    company: "Acme Corp",
    title: "Senior Mobile Developer",
    description: "Built mobile apps",
    tags: ["android", "kotlin"],
    sortOrder: 0,
  };

  it("accepts a fully populated valid role", () => {
    const result = roleSchema.parse(validRole);
    expect(result.company).toBe("Acme Corp");
    expect(result.tags).toEqual(["android", "kotlin"]);
  });

  it("accepts role without optional id, tags, sortOrder", () => {
    const { id, tags, sortOrder, ...rest } = validRole;
    void id; void tags; void sortOrder;
    const result = roleSchema.parse(rest);
    expect(result.id).toBeUndefined();
    expect(result.tags).toBeUndefined();
    expect(result.sortOrder).toBeUndefined();
  });

  it("rejects empty period", () => {
    expect(() => roleSchema.parse({ ...validRole, period: "" })).toThrow();
  });

  it("rejects empty company", () => {
    expect(() => roleSchema.parse({ ...validRole, company: "" })).toThrow();
  });

  it("rejects empty title", () => {
    expect(() => roleSchema.parse({ ...validRole, title: "" })).toThrow();
  });

  it("rejects missing period", () => {
    const { period, ...rest } = validRole;
    void period;
    expect(() => roleSchema.parse(rest)).toThrow();
  });

  it("rejects missing company", () => {
    const { company, ...rest } = validRole;
    void company;
    expect(() => roleSchema.parse(rest)).toThrow();
  });

  it("rejects missing title", () => {
    const { title, ...rest } = validRole;
    void title;
    expect(() => roleSchema.parse(rest)).toThrow();
  });

  it("rejects non-array tags when provided", () => {
    expect(() => roleSchema.parse({ ...validRole, tags: "android" })).toThrow();
  });

  it("accepts empty string for description", () => {
    const result = roleSchema.parse({ ...validRole, description: "" });
    expect(result.description).toBe("");
  });
});

// ---------------------------------------------------------------------------
// siteSettingsSchema
// ---------------------------------------------------------------------------
describe("siteSettingsSchema", () => {
  const validSettings = {
    name: "Nikita Pochaev",
    handle: "po4yka",
    role: "Mobile Developer",
    bio: "Building mobile apps",
    github: "https://github.com/po4yka",
    email: "nikita@example.com",
    telegram: "https://t.me/po4yka",
    linkedin: "https://linkedin.com/in/po4yka",
  };

  it("accepts a fully populated valid settings object", () => {
    const result = siteSettingsSchema.parse(validSettings);
    expect(result.name).toBe("Nikita Pochaev");
    expect(result.handle).toBe("po4yka");
  });

  it("rejects empty name", () => {
    expect(() => siteSettingsSchema.parse({ ...validSettings, name: "" })).toThrow();
  });

  it("rejects empty handle", () => {
    expect(() => siteSettingsSchema.parse({ ...validSettings, handle: "" })).toThrow();
  });

  it("rejects missing name", () => {
    const { name, ...rest } = validSettings;
    void name;
    expect(() => siteSettingsSchema.parse(rest)).toThrow();
  });

  it("rejects missing handle", () => {
    const { handle, ...rest } = validSettings;
    void handle;
    expect(() => siteSettingsSchema.parse(rest)).toThrow();
  });

  it("accepts empty strings for optional-feeling fields like role and bio", () => {
    // role, bio, github, email, telegram, linkedin have no min(1)
    const result = siteSettingsSchema.parse({ ...validSettings, role: "", bio: "" });
    expect(result.role).toBe("");
    expect(result.bio).toBe("");
  });

  it("accepts empty strings for contact links", () => {
    const result = siteSettingsSchema.parse({
      ...validSettings,
      github: "",
      email: "",
      telegram: "",
      linkedin: "",
    });
    expect(result.github).toBe("");
  });

  it("rejects entirely empty object", () => {
    expect(() => siteSettingsSchema.parse({})).toThrow();
  });
});

// ---------------------------------------------------------------------------
// categorySchema
// ---------------------------------------------------------------------------
describe("categorySchema", () => {
  it("accepts a valid category name", () => {
    const result = categorySchema.parse({ name: "Engineering" });
    expect(result.name).toBe("Engineering");
  });

  it("rejects empty name", () => {
    expect(() => categorySchema.parse({ name: "" })).toThrow();
  });

  it("rejects missing name", () => {
    expect(() => categorySchema.parse({})).toThrow();
  });

  it("rejects non-string name", () => {
    expect(() => categorySchema.parse({ name: 42 })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// validationError helper
// ---------------------------------------------------------------------------
describe("validationError", () => {
  it("returns a 400 Response with JSON body", () => {
    const result = blogPostSchema.safeParse({ slug: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const response = validationError(result.error);
      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    }
  });

  it("includes error and details in the response body", async () => {
    const result = blogPostSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const response = validationError(result.error);
      const body = await response.json();
      expect(body).toHaveProperty("error", "Invalid request");
      expect(body).toHaveProperty("details");
      expect(Array.isArray(body.details)).toBe(true);
    }
  });
});
