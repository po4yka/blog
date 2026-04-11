import { test, expect } from "@playwright/test";

const ALL_POSTS = [
  {
    slug: "kmp-shared-logic-without-shared-ui",
    title: "KMP: Shared Logic Without Shared UI",
    date: "Feb 2026",
    category: "Architecture",
    tags: ["KMP", "Architecture"],
  },
  {
    slug: "mobile-ci-that-actually-works",
    title: "Mobile CI That Actually Works",
    date: "Jan 2026",
    category: "DevOps",
    tags: ["MobileOps", "CI/CD"],
  },
  {
    slug: "compose-stability-deep-dive",
    title: "A Deep Dive into Compose Stability",
    date: "Dec 2025",
    category: "Android",
    tags: ["Android", "Compose"],
  },
  {
    slug: "gradle-build-time-optimization",
    title: "Cutting Gradle Build Times in Half",
    date: "Nov 2025",
    category: "Tooling",
    tags: ["Android", "Tooling"],
  },
  {
    slug: "ios-background-downloads-done-right",
    title: "iOS Background Downloads Done Right",
    date: "Oct 2025",
    category: "iOS",
    tags: ["iOS", "Swift"],
  },
];

/**
 * Select a category filter and wait for the filter state to propagate.
 *
 * The BlogListIsland hydrates with `client:idle`, so the click may fire
 * against the pre-hydration SSR markup. Retry click + state-check with
 * toPass() until React picks it up and re-renders the MacWindow title.
 */
async function selectCategory(
  page: import("@playwright/test").Page,
  category: string,
) {
  const expectedTitle = `posts — ${category.toLowerCase()}`;
  await expect(async () => {
    await page
      .getByRole("button", { name: category, exact: true })
      .click({ force: true });
    await expect(page.getByText(expectedTitle)).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15000 });
}

test.describe("Blog list page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/blog");
    // Wait for the BlogListIsland to hydrate -- category filter buttons become visible
    await page.getByRole("button", { name: "All" }).waitFor({ state: "visible" });
  });

  test("shows all 5 posts", async ({ page }) => {
    for (const post of ALL_POSTS) {
      await expect(page.getByText(post.title)).toBeVisible();
    }
  });

  test("category filter narrows the list", async ({ page }) => {
    await selectCategory(page, "Android");

    // Only posts with category "Android" should be visible
    const androidPosts = ALL_POSTS.filter((p) => p.category === "Android");
    const otherPosts = ALL_POSTS.filter((p) => p.category !== "Android");

    for (const post of androidPosts) {
      await expect(page.getByText(post.title)).toBeVisible();
    }

    for (const post of otherPosts) {
      await expect(page.getByText(post.title)).not.toBeVisible();
    }
  });

  test("clicking 'All' restores the full list", async ({ page }) => {
    // Filter first
    await selectCategory(page, "iOS");
    // Only 1 post visible
    await expect(page.getByText("iOS Background Downloads Done Right")).toBeVisible();
    await expect(page.getByText("Mobile CI That Actually Works")).not.toBeVisible();

    // Click "All" to restore
    await selectCategory(page, "All");

    for (const post of ALL_POSTS) {
      await expect(page.getByText(post.title)).toBeVisible();
    }
  });

  test("each post shows its date", async ({ page }) => {
    for (const post of ALL_POSTS) {
      await expect(page.getByText(post.date)).toBeVisible();
    }
  });
});

test.describe("Blog post page", () => {
  const post = ALL_POSTS[0]!; // KMP post (featured)

  test.beforeEach(async ({ page }) => {
    await page.goto(`/blog/${post.slug}`);
  });

  test("displays post title", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(post.title);
  });

  test("displays date and category metadata", async ({ page }) => {
    // The post page renders: date <span>{post.date}</span> and category <span>{post.category}</span>
    await expect(page.getByText(post.date)).toBeVisible();
    await expect(page.getByText(post.category, { exact: true }).first()).toBeVisible();
  });

  test("displays tags", async ({ page }) => {
    for (const tag of post.tags) {
      await expect(page.getByText(`#${tag}`)).toBeVisible();
    }
  });

  test("displays article content", async ({ page }) => {
    // The KMP post contains real prose content
    await expect(page.locator(".prose-blog")).toBeVisible();
    await expect(page.locator(".prose-blog")).not.toBeEmpty();
  });

  test("has a back link to all posts", async ({ page }) => {
    const backLink = page.getByText("All posts");
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/\/blog\/?$/);
  });
});
