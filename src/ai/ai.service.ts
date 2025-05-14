import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import * as os from 'os';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private openApiKey: string;

  constructor() {
    this.openApiKey = process.env.OPENAI_API_KEY || '';
    this.openai = new OpenAI({
      apiKey: this.openApiKey,
    });
  }

  async transcribeAudio(filePath: string): Promise<string> {
    const maxChunkSize = 25 * 1024 * 1024;
    const fileStats = fs.statSync(filePath);

    if (fileStats.size <= maxChunkSize) {
      return await this.transcribeSingleChunk(filePath);
    }

    // Split into chunks
    const chunkPaths = await this.splitFileIntoChunks(filePath, maxChunkSize);

    const results: string[] = [];

    for (const chunkPath of chunkPaths) {
      const transcript = await this.transcribeSingleChunk(chunkPath);
      results.push(transcript);
      fs.unlinkSync(chunkPath); // clean up
    }

    fs.unlinkSync(filePath); // remove original
    return results.join('\n');
  }

  private async transcribeSingleChunk(filePath: string): Promise<string> {
    const fileStream = fs.createReadStream(filePath);

    const result = await this.openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
      response_format: 'text',
      language: 'en',
    });

    return result;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async splitFileIntoChunks(
    filePath: string,
    chunkSize: number,
  ): Promise<string[]> {
    const chunkPaths: string[] = [];
    const buffer = fs.readFileSync(filePath);
    const totalSize = buffer.length;
    const chunkCount = Math.ceil(totalSize / chunkSize);

    for (let i = 0; i < chunkCount; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, totalSize);
      const chunkBuffer = buffer.slice(start, end);
      const chunkPath = path.join(
        os.tmpdir(),
        `chunk_${Date.now()}_${i}${path.extname(filePath)}`,
      );
      fs.writeFileSync(chunkPath, chunkBuffer);
      chunkPaths.push(chunkPath);
    }

    return chunkPaths;
  }
}
