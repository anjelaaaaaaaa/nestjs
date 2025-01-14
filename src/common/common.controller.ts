import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CommonService } from './common.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Controller('common')
@ApiBearerAuth()
export class CommonController {
  constructor(
    private readonly commonService: CommonService,
    @InjectQueue('thumbnail-generation')
    private readonly thumbnailQueue: Queue,
  ) {}

  @Post('video')
  @UseInterceptors(
    FileInterceptor('video', {
      limits: {
        fileSize: 200000000,
      },
      fileFilter(req, file, callback) {
        console.log(file);
        if (file.mimetype !== 'video/mp4') {
          return callback(
            new BadRequestException('MP4 타입만 업로드 가능합니다.'),
            false,
          );
        }
        return callback(null, true);
      },
    }),
  )
  async createVideo(@UploadedFile() video: Express.Multer.File) {
    await this.thumbnailQueue.add(
      'thumbnail',
      {
        videoId: video.filename,
        videoPath: video.path,
      },
      {
        priority: 1, // 숫자가 낮을수록 높은 우선순위
        delay: 100, // 100msec 기다렸다가 작업하는 것
        attempts: 3, // 작업이 실패하는 경우 몇번 다시 시도할지
        lifo: true, // last in first out -> true 로 설정하는 경우 스택처럼 사용가능,
        removeOnComplete: false, // 성공한경우 redis에서 삭제
        removeOnFail: true, // 실패한경우 redis에서 삭제
      },
    );
    return {
      fileName: video.filename,
    };
  }

  @Post('presigned-url')
  async createPresignedUrl() {
    return {
      url: await this.commonService.createPresignedUrl(),
    };
  }
}
