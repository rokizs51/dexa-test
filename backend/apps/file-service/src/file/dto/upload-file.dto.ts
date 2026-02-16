export interface UploadFileDto {
  buffer: string; // base64 encoded
  originalName: string;
  mimeType: string;
  size: number;
}
