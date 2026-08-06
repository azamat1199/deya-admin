/**
 * Confirmed via Swagger. Full `type` enum unconfirmed beyond "heading" —
 * "text" and "image" are the likely remaining values; adjust
 * POST_BLOCK_TYPES below once the real list is known.
 */
export const POST_BLOCK_TYPES = ["heading", "text", "image"] as const;

export type PostBlockType = (typeof POST_BLOCK_TYPES)[number];

export interface PostBlock {
  id: number;
  post: number;
  type: PostBlockType;
  text: string;
  image: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PostBlockPayload {
  post: number;
  type: PostBlockType;
  text: string;
  image?: string;
  sort_order: number;
}

export type PatchPostBlockRequest = Partial<PostBlockPayload>;

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover: string;
  published_at: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostPayload {
  title: string;
  slug: string;
  excerpt: string;
  cover?: string;
  published_at: string;
  is_published: boolean;
}

export type PatchPostRequest = Partial<PostPayload>;
