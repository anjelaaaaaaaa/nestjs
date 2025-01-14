import { Module } from '@nestjs/common';
import { GenreService } from './genre.service';
import { GenreController } from './genre.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { Genre } from './entity/genre.entity';
import { Movie } from '../movie/entity/movie.entity';
import { CommonModule } from '../common/common.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Genre, GenreSchema } from './schema/genre.schema';

@Module({
  imports: [
    // TypeOrmModule.forFeature([Genre, Movie]),
    MongooseModule.forFeature([
      {
        name: Genre.name,
        schema: GenreSchema,
      },
    ]),
    CommonModule,
  ],
  controllers: [GenreController],
  providers: [GenreService],
})
export class GenreModule {}
