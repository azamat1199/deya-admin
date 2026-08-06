import { apiClient } from "./client";

interface UploadFileResponse {
  id: number;
  file: string;
}

/** Uploads a file and returns its URL, to be sent as a plain string field. */
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<UploadFileResponse>(
    "/api/v1/upload/file/",
    formData,
  );
  return data.file;
}
