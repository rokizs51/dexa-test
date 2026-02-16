import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import * as sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { DrizzleService, files } from '@dexa/database';
import { eq } from 'drizzle-orm';
import { LocalStorageService } from '../storage/local-storage.service';
import { FileResponseDto } from './dto/file-response.dto';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly allowedTypes = ['image/jpeg', 'image/png'];
  private readonly maxSize = 5 * 1024 * 1024; // 5MB

  constructor(
    private readonly localStorageService: LocalStorageService,
    private readonly drizzle: DrizzleService,
  ) {}

  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    size: number,
  ): Promise<FileResponseDto> {
    this.logger.log(`Starting file upload: ${originalName}, size: ${size}`);

    // Step 1: Validate file type using magic numbers (file-type)
    const fileType = await fileTypeFromBuffer(buffer);
    if (!fileType || !this.allowedTypes.includes(fileType.mime)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${this.allowedTypes.join(', ')}`
      );
    }

    // Step 2: Validate size (defense in depth, already checked in gateway)
    if (size > this.maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed (${this.maxSize / 1024 / 1024}MB)`
      );
    }

    // Step 3: Calculate content hash for deduplication
    const contentHash = createHash('sha256').update(buffer).digest('hex');
    this.logger.debug(`Content hash: ${contentHash}`);

    // Step 4: Check for existing file (deduplication - ATT-12)
    const existing = await this.drizzle.db.query.files.findFirst({
      where: eq(files.contentHash, contentHash),
    });

    if (existing) {
      this.logger.log(`Duplicate file detected: ${contentHash}`);
      this.logger.log(`Existing file: ${JSON.stringify({ objectKey: existing.objectKey, originalName: existing.originalName })}`);
      const url = this.buildUrl(existing.objectKey);
      this.logger.log(`Built URL for duplicate: ${url}`);
      const response = {
        url,
        isDuplicate: true,
        contentHash,
        originalName: existing.originalName,
      };
      this.logger.log(`Returning response for duplicate: ${JSON.stringify(response)}`);
      return response;
    }

    // Step 5: Strip EXIF metadata (ATT-11) - sharp strips by default
    this.logger.debug('Stripping EXIF metadata...');
    const processedBuffer = await sharp(buffer)
      .jpeg({ quality: 90 }) // Convert to JPEG with quality 90
      .toBuffer();

    // Step 6: Upload to local storage
    this.logger.log('Uploading to local storage...');
    const { url, objectKey } = await this.localStorageService.uploadFile(
      processedBuffer,
      originalName,
    );
    this.logger.log(`File uploaded successfully: ${objectKey}, URL: ${url}`);

    // Step 7: Record in database
    await this.drizzle.db.insert(files).values({
      originalName,
      storedName: objectKey,
      contentHash,
      mimeType: fileType.mime,
      size: processedBuffer.length,
      bucket: 'local-storage',
      objectKey,
    });
    this.logger.log('File record saved to database');

    const response = {
      url,
      isDuplicate: false,
      contentHash,
      originalName,
    };
    this.logger.log(`Returning response for new upload: ${JSON.stringify(response)}`);
    return response;
  }

  private buildUrl(objectKey: string): string {
    const baseUrl = process.env.FILE_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/files/attendance/${objectKey}`;
    this.logger.debug(`Building URL: ${url} (base: ${baseUrl}, objectKey: ${objectKey})`);
    return url;
  }
}
