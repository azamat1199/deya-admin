import { apiClient } from "./client";
import type {
  PostBlock,
  PostBlockPayload,
  PatchPostBlockRequest,
  Post,
  PostPayload,
  PatchPostRequest,
} from "../types/blog";

const POST_BLOCKS_URL = "/api/v1/admin/blog/post-blocks/";
const POSTS_URL = "/api/v1/admin/blog/posts/";

export const blogApi = {
  getPostBlocks: () => apiClient.get<PostBlock[]>(POST_BLOCKS_URL),

  getPostBlock: (id: number) =>
    apiClient.get<PostBlock>(`${POST_BLOCKS_URL}${id}/`),

  createPostBlock: (data: PostBlockPayload) =>
    apiClient.post<PostBlock>(POST_BLOCKS_URL, data),

  updatePostBlock: (id: number, data: PostBlockPayload) =>
    apiClient.put<PostBlock>(`${POST_BLOCKS_URL}${id}/`, data),

  patchPostBlock: (id: number, data: PatchPostBlockRequest) =>
    apiClient.patch<PostBlock>(`${POST_BLOCKS_URL}${id}/`, data),

  deletePostBlock: (id: number) =>
    apiClient.delete<void>(`${POST_BLOCKS_URL}${id}/`),

  getPosts: () => apiClient.get<Post[]>(POSTS_URL),

  getPost: (id: number) => apiClient.get<Post>(`${POSTS_URL}${id}/`),

  createPost: (data: PostPayload) => apiClient.post<Post>(POSTS_URL, data),

  updatePost: (id: number, data: PostPayload) =>
    apiClient.put<Post>(`${POSTS_URL}${id}/`, data),

  patchPost: (id: number, data: PatchPostRequest) =>
    apiClient.patch<Post>(`${POSTS_URL}${id}/`, data),

  deletePost: (id: number) => apiClient.delete<void>(`${POSTS_URL}${id}/`),
};
