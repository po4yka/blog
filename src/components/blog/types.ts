export interface PostMeta {
  title: string;
  date: string;
  isoDate?: string;
  isoDateModified?: string;
  summary: string;
  tags: string[];
  category: string;
  readingTime?: number;
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
