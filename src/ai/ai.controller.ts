/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('transcribe')
  @UseInterceptors(
    FileInterceptor('file', {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
      fileFilter: (req, file, cb) => {
        const allowed = ['.mp3', '.mp4', '.m4a', '.webm', '.wav'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Unsupported file type'), false);
        }
      },
    }),
  )
  async transcribeAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const filePath = (file as Express.Multer.File & { path: string }).path;

    const transcript = await this.aiService.transcribeAudio(filePath);
    return { transcript };
  }
}
