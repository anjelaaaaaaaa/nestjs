import { Module } from '@nestjs/common';
import { GenreService } from './genre.service';
import { GenreController } from './genre.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Genre } from './entities/genre.entity';
import { Movie } from '../movie/entity/movie.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Genre, Movie])],
  controllers: [GenreController],
  providers: [GenreService],
})
export class GenreModule {}
