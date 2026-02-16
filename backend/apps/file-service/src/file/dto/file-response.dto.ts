export interface FileResponseDto {
  url: string; // presigned URL
  isDuplicate: boolean;
  contentHash: string;
  originalName?: string;
}
