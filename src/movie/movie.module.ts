import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from '../director/entity/director.entity';
import { Genre } from '../genre/entities/genre.entity';
import { CommonModule } from '../common/common.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { User } from '../user/entities/user.entity';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Movie,
      MovieDetail,
      Director,
      Genre,
      User,
      MovieUserLike,
    ]),
    CommonModule,
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'public', 'movie'),
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
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
