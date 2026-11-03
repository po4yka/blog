export interface PostMeta {
  title: string;
  date: string;
  isoDate?: string;
  isoDateModified?: string;
  summary: string;
  tags: string[];
  category: string;
  readingTime?: number;
  wordCount?: number;
  /** Blocks in reading order; with wordCount, the cover's inputs. */
  outline?: string;
}

export interface AdjacentPost {
  slug: string;
  title: string;
  date: string;
}

export interface RelatedPost {
  slug: string;
  title: string;
  date: string;
  isoDate?: string;
  category: string;
  summary: string;
}
