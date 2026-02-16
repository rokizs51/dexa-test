import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileResponseDto } from './dto/file-response.dto';
import { FileService } from './file.service';

@Controller()
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(private readonly fileService: FileService) {}

  @MessagePattern({ cmd: 'upload_file' })
  async handleUpload(@Payload() data: UploadFileDto): Promise<FileResponseDto> {
    const buffer = Buffer.from(data.buffer, 'base64');

    this.logger.log(`Received upload: ${data.originalName}, size: ${data.size}, decoded: ${buffer.length} bytes`);

    try {
      return await this.fileService.uploadFile(
        buffer,
        data.originalName,
        data.mimeType,
        data.size,
      );
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`, error.stack);
      throw error; // Re-throw to propagate to gateway
    }
  }
}
