export const prerender = false;

import { posts } from "@/lib/collections";

export const GET = posts.routes.get;
export const PUT = posts.routes.update;
export const DELETE = posts.routes.delete;
