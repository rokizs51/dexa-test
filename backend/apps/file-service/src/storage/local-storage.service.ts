import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

@Injectable()
export class LocalStorageService implements OnModuleInit {
  private readonly logger = new Logger(LocalStorageService.name);
  private uploadDir: string;
  private baseUrl: string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    // Set upload directory (in the container/app)
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || './uploads/attendance-photos';
    // Base URL for serving files (will be the API gateway URL)
    this.baseUrl = this.configService.get<string>('FILE_BASE_URL') || 'http://localhost:3000';

    this.logger.log(`Initializing LocalStorageService with uploadDir: ${this.uploadDir}, baseUrl: ${this.baseUrl}`);

    // Ensure upload directory exists
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`Upload directory ready: ${this.uploadDir}`);
    } catch (error) {
      this.logger.error(`Failed to create upload directory: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload a file to local storage
   * @param buffer - The file buffer
   * @param originalName - Original filename
   * @returns The URL to access the file
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
  ): Promise<{ url: string; objectKey: string }> {
    this.logger.log(`LocalStorageService.uploadFile called: ${originalName}, buffer size: ${buffer.length}`);

    try {
      // Calculate content hash for deduplication
      const contentHash = createHash('sha256').update(buffer).digest('hex');
      const extension = this.getExtension(originalName);
      const filename = `${contentHash}.${extension}`;

      // Create subdirectories based on hash prefix (organizes files by first 2 chars)
      const prefix = contentHash.substring(0, 2);
      const subDir = join(this.uploadDir, prefix);
      await fs.mkdir(subDir, { recursive: true });
      this.logger.debug(`Created subdirectory: ${subDir}`);

      // Full file path
      const filePath = join(subDir, filename);

      // Check if file already exists (deduplication)
      try {
        await fs.access(filePath);
        this.logger.log(`File already exists (duplicate): ${filename}`);
        const objectKey = `${prefix}/${filename}`;
        const url = `${this.baseUrl}/files/attendance/${objectKey}`;
        this.logger.log(`Returning existing file URL: ${url}`);
        return { url, objectKey };
      } catch {
        // File doesn't exist, continue with upload
      }

      // Write file to disk
      this.logger.log(`Writing file to disk: ${filePath}`);
      await fs.writeFile(filePath, buffer);
      this.logger.log(`File saved successfully: ${filePath}`);

      const objectKey = `${prefix}/${filename}`;
      const url = `${this.baseUrl}/files/attendance/${objectKey}`;
      this.logger.log(`Generated objectKey: ${objectKey}, url: ${url}`);

      return { url, objectKey };
    } catch (error) {
      this.logger.error(`Failed to save file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get file path from object key
   * @param objectKey - The object key (e.g., "46/abc123.jpg")
   * @returns Full file path
   */
  getFilePath(objectKey: string): string {
    return join(this.uploadDir, objectKey);
  }

  /**
   * Get extension from filename
   */
  private getExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext === 'png' ? 'png' : 'jpg';
  }

  /**
   * Get the upload directory
   */
  getUploadDir(): string {
    return this.uploadDir;
  }
}
