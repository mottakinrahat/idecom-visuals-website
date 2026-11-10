import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';

const MB = 1024 * 1024;
const interceptor = (maxMb: number) =>
  FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: maxMb * MB } });

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploads: UploadService) {}

  /** POST /api/uploads/image — multipart field "file", JPG/PNG/WEBP/GIF, ≤ 10 MB */
  @Post('image')
  @UseInterceptors(interceptor(10))
  image(@UploadedFile() file?: Express.Multer.File) {
    return this.uploads.upload(file, 'image');
  }

  /** POST /api/uploads/video — multipart field "file", MP4/WebM/MOV, ≤ 100 MB */
  @Post('video')
  @UseInterceptors(interceptor(100))
  video(@UploadedFile() file?: Express.Multer.File) {
    return this.uploads.upload(file, 'video');
  }
}
