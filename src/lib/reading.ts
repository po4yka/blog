/** Minutes to read a post: its own readingTime, else its word count at 200 words a minute. */
export function readingMinutes(post: { readingTime?: number; wordCount?: number }): number | null {
  return post.readingTime ?? (post.wordCount ? Math.max(1, Math.round(post.wordCount / 200)) : null);
}
