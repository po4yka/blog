export const prerender = false;

import { posts } from "@/lib/collections";

export const GET = posts.routes.list;
export const POST = posts.routes.create;
