import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { join } from 'path';
import { cwd } from 'process';
import * as ffmpegFluet from 'fluent-ffmpeg';

@Processor('thumbnail-generation')
export class ThumbnailGenerationProcess extends WorkerHost {
  async process(job: Job, token?: string): Promise<any> {
    const { videoPath, videoId } = job.data;

    const outputDirectory = join(cwd(), 'public', 'thumbnail');
    console.log(`영상 트랜스 코딩중 Id : ${videoId}`);

    ffmpegFluet(videoPath)
      .screenshots({
        count: 1,
        filename: `${videoId}.png`,
        folder: outputDirectory,
        size: '320x240',
      })
      .on('end', () => {
        console.log(`썸네일 생성완료 Id : ${videoId}`);
      })
      .on('error', () => {
        console.log(`썸네일 생성실패 Id : ${videoId}`);
      });
  }
}
