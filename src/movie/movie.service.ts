import { Injectable, NotFoundException } from '@nestjs/common';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from '../director/entity/director.entity';
import { Genre } from '../genre/entities/genre.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(title?: string) {
    const qb = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if (title) {
      qb.where('movie.title LIKE :title', { title: `%${title}%` });
    }

    return await qb.getManyAndCount();
    // if (!title) {
    //   return [
    //     await this.movieRepository.find({
    //       relations: ['director', 'genres'],
    //     }),
    //     await this.movieRepository.count(),
    //   ];
    // }
    // return this.movieRepository.findAndCount({
    //   where: {
    //     title: Like(`%${title}%`),
    //   },
    //   relations: ['director', 'genres'],
    // });
  }

  async findOne(id: number) {
    const qb = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .where('movie.id = :id', { id })
      .getOne();

    return qb;
    // const movie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail', 'director', 'genres'],
    // });
    // if (!movie) {
    //   throw new NotFoundException(`movie not Found.`);
    // }
    // return movie;
  }

  async create(createMovieDto: CreateMovieDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const director = await qr.manager.findOne(Director, {
        where: {
          id: createMovieDto.directorId,
        },
      });
      if (!director) {
        throw new NotFoundException(`존재하지 않는 감독입니다.`);
      }
      const genres = await qr.manager.find(Genre, {
        where: {
          id: In(createMovieDto.genreIds),
        },
      });
      if (genres.length !== createMovieDto.genreIds.length) {
        throw new NotFoundException(
          `존재하지 않는 장르입니다. 존재 : ${genres.map((genre) => genre.id).join(',')}`,
        );
      }

      // 쿼리빌더 사용하는 경우 아래처럼 캐스케이드로 바로 detail을 집어넣을 수 없음.
      // const movie = await this.movieRepository.save({
      //   title: createMovieDto.title,
      //   detail: {
      //     detail: createMovieDto.detail,
      //   },
      //   director,
      //   genres,
      // });
      // return movie;
      //

      // 1. 디테일 먼저 생성하고
      const movieDetail = await qr.manager
        .createQueryBuilder()
        .insert()
        .into(MovieDetail)
        .values({
          detail: createMovieDto.detail,
        })
        .execute();

      // 2. 디테일의 id를 가지고옴. identifiers는 리스트로 아이디를 가지고 와줌.
      const movieDetailId = movieDetail.identifiers[0].id;

      // 3. detail에 생성된 아이디를 넣어주면서 무비를 생성함.
      const movie = await qr.manager
        .createQueryBuilder()
        .insert()
        .into(Movie)
        .values({
          title: createMovieDto.title,
          detail: { id: movieDetailId },
          director, // 얘는 이미 생성되어 있는걸 가지고와서 쓰는거기 때문에 바로 insert 가능.
          // genres, // 이미 존재하지만 many to many 관계는 바로 insert 불가.
        })
        .execute();

      // 4. 생성된 무비의 아이디를 가지고옴.
      const movieId = await movie.identifiers[0].id;

      // 5. many to many 관계설정은 이렇게 따로 해줘야함.
      await qr.manager
        .createQueryBuilder()
        .relation(Movie, 'genres') // 무비와 어떤 테이블의 관계를 설정할지 ?
        .of(movieId) // 어떤 값을 기준으로 ?
        .add(genres.map((genre) => genre.id));

      await qr.commitTransaction();
      return await this.movieRepository.findOne({
        where: {
          id: movieId,
        },
        relations: ['director', 'genres', 'detail'],
      });
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const movie = await qr.manager.findOne(Movie, {
        where: {
          id,
        },
        relations: ['detail', 'genres'],
      });
      if (!movie) {
        throw new NotFoundException(`존재ㅏ지 않는 영화 id임`);
      }

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;
      let newDirector;
      if (directorId) {
        const director = await qr.manager.findOne(Director, {
          where: {
            id: directorId,
          },
        });
        if (!director) {
          throw new NotFoundException(`존재하지 않는 감독입니다.`);
        }
        newDirector = director;
      }

      let newGenres;
      if (genreIds) {
        const genres = await qr.manager.find(Genre, {
          where: {
            id: In(genreIds),
          },
        });
        if (genres.length !== updateMovieDto.genreIds.length) {
          throw new NotFoundException(`
        존재하지 않는 장르가 있음 : ${genres.map((genre) => genre.id).join(',')}`);
        }
        newGenres = genres;
      }

      const movieUpdateFields = {
        ...movieRest,
        ...(newDirector && { director: newDirector }),
      };

      await qr.manager
        .createQueryBuilder()
        .update(Movie)
        .set(movieUpdateFields)
        .where('id = :id', { id })
        .execute();

      // await this.movieRepository.update({ id }, movieUpdateFields);

      if (detail) {
        await qr.manager
          .createQueryBuilder()
          .update(MovieDetail)
          .set({ detail })
          .where('id = :id', { id: movie.detail.id })
          .execute();

        // await this.movieDetailRepository.update(
        //   { id: movie.detail.id },
        //   { detail },
        // );
      }

      if (newGenres) {
        await qr.manager
          .createQueryBuilder()
          .relation(Movie, 'genres')
          .of(id)
          .addAndRemove(
            newGenres.map((genre) => genre.id),
            movie.genres.map((genre) => genre.id),
          );
      }

      // repository method를 사용해서 many to many 관계의 장르를 업데이트 해줌.
      // const newMovie = await this.movieRepository.findOne({
      //   where: { id },
      //   relations: ['detail', 'director', 'genres'],
      // });
      // newMovie.genres = newGenres;
      // await this.movieRepository.save(newMovie);

      await qr.commitTransaction();

      return this.movieRepository.findOne({
        where: { id },
        relations: ['detail', 'director', 'genres'],
      });
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  async remove(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail'],
    });
    if (!movie) {
      throw new NotFoundException(`존재하지 않는 영화 id`);
    }

    await this.movieRepository
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .execute();

    // await this.movieRepository.delete(id);
    await this.movieDetailRepository.delete(movie.detail.id);
  }
}
