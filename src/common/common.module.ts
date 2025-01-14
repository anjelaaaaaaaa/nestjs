import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../movie/entity/movie.entity';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movie]),
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'public', 'temp'),
        filename: (req, file, cb) => {
          const split = file.originalname.split('.');
          let extension = 'mp4';
          if (split.length > 1) {
            extension = split[split.length - 1];
          }
          cb(null, `${v4()}_${Date.now()}.${extension}`);
        },
      }),
    }),
    /**
     * 1. 작업들을 올려둘 queue를 redis로 사용할건데 redis endpoint 세팅을 해야함.
     *
     * 2. queue 등록
     */
    BullModule.forRoot({
      connection: {
        host: 'redis-16654.c340.ap-northeast-2-1.ec2.redns.redis-cloud.com',
        port: 16654,
        username: 'default',
        password: 'QNxQn6VWeBqR7HPU1pI8ptOHJI4zvAPR',
      },
    }),
    BullModule.registerQueue({
      name: 'thumbnail-generation', // 실제 작업의 이름
    }),
  ],
  controllers: [CommonController],
  providers: [CommonService, TasksService, PrismaService],
  exports: [CommonService, PrismaService],
})
export class CommonModule {}
