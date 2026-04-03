export const prerender = false;

import { projects } from "@/lib/collections";

export const GET = projects.routes.list;
export const POST = projects.routes.create;
