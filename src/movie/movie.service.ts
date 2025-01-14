import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from '../common/common.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
// import { PrismaService } from '../common/prisma.service';
// import { Prisma } from '@prisma/client';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Document } from 'mongoose';
import { Movie } from './schema/movie.schema';
import { MovieDetail } from './schema/movie-detail.schema';
import { Director } from '../director/schema/director.schema';
import { Genre } from '../genre/schema/genre.schema';
import { MovieUserLike } from './schema/movie-user-like.schema';
import { User } from '../user/schema/user.schema';

@Injectable()
export class MovieService {
  constructor(
    // @InjectRepository(Movie)
    // private readonly movieRepository: Repository<Movie>,
    // @InjectRepository(MovieDetail)
    // private readonly movieDetailRepository: Repository<MovieDetail>,
    // @InjectRepository(Director)
    // private readonly directorRepository: Repository<Director>,
    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
    // @InjectRepository(MovieUserLike)
    // private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    /// 캐싱 기능쓰려면 인젝트 해주기
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    // private readonly prisma: PrismaService,
    @InjectModel(Movie.name)
    private readonly movieModel: Model<Movie>,
    @InjectModel(MovieDetail.name)
    private readonly movieDetailModel: Model<MovieDetail>,
    @InjectModel(Director.name)
    private readonly directorModel: Model<Director>,
    @InjectModel(Genre.name)
    private readonly genreModel: Model<Genre>,
    @InjectModel(MovieUserLike.name)
    private readonly movieUserLikeModel: Model<MovieUserLike>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');
    if (cacheData) {
      return cacheData;
    }

    /**
     * Mongodb
     */
    const data = await this.movieModel
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();
    /**
     * prisma
     */
    // const data = await this.prisma.movie.findMany({
    //   orderBy: {
    //     createdAt: 'desc',
    //   },
    //   take: 10,
    // });
    /**
     * TypeORM
     */
    // const data = await this.movieRepository.find({
    //   order: {
    //     createdAt: 'DESC',
    //   },
    //   take: 10,
    // });

    await this.cacheManager.set('MOVIE_RECENT', data);
    return data;
  }

  async findAll(dto: GetMoviesDto, userId?: number) {
    const { title, cursor, take, order } = dto;

    const orderBy = order.reduce((acc, field) => {
      const [column, direction] = field.split('_');
      acc[column] = direction.toLocaleLowerCase();
      return acc;
    }, {});

    /**
     * prisma 를 기반으로 만들어진 orderBy 이므로 몽구스에는 적용 불가능
     */
    // const orderBy = order.map((field) => {
    //   const [column, direction] = field.split('_');
    //   return { [column]: direction.toLocaleLowerCase() };
    // });

    // const movies = await this.prisma.movie.findMany({
    //   where: title ? { title: { contains: title } } : {},
    //   take: take + 1, // prisma의 특성때문에 +1 해줘야함
    //   skip: cursor ? 1 : 0,
    //   cursor: cursor ? { id: parseInt(cursor) } : undefined,
    //   orderBy,
    //   include: {
    //     genres: true,
    //     director: true,
    //   },
    // });

    const query = this.movieModel
      .find(
        title
          ? {
              title: {
                $regex: title,
              },
              $option: 'i', // 대소문자 구분안함
            }
          : {},
      )
      .sort(orderBy)
      .limit(take + 1);

    if (cursor) {
      query.skip(1).gt('_id', new Types.ObjectId(cursor));
    }
    const movies = await query.populate('genres director').exec();

    const hasNextPage = movies.length > take;
    if (hasNextPage) movies.pop();

    const nextCursor = hasNextPage
      ? movies[movies.length - 1]._id.toString()
      : null;

    // const qb = this.movieRepository
    //   .createQueryBuilder('movie')
    //   .leftJoinAndSelect('movie.director', 'director')
    //   .leftJoinAndSelect('movie.genres', 'genres');

    // if (title) {
    //   qb.where('movie.title LIKE :title', { title: `%${title}%` });
    // }
    /**
     * 페이지 기반 페이지 네이션임.
     */
    // if (take && page) {
    //   this.commonService.applyPagePaginationParamsToQb(qb, dto);
    // }

    // const { nextCursor } =
    //   await this.commonService.applyCursorPaginationParamsToQb(qb, dto);

    // let [data, count] = await qb.getManyAndCount();

    if (userId) {
      const movieIds = movies.map((movie) => movie._id);
      // const movieIds = data.map((movie) => movie.id);

      const likedMovies =
        movies.length < 1
          ? []
          : await this.movieUserLikeModel
              .find({
                movie: { $in: movieIds },
                user: { userId },
              })
              .populate('movie')
              .exec();
      /**
       * prisma
       */
      // const likedMovies =
      //   movieIds.length < 1
      //     ? []
      //     : await this.prisma.movieUserLike.findMany({
      //         where: {
      //           movieId: { in: movieIds },
      //           userId: userId,
      //         },
      //         include: { movie: true },
      //       });
      /**
       * TypeORM
       */
      // const likedMovies =
      //   movieIds.length < 1
      //     ? []
      //     : await this.movieUserLikeRepository
      //         .createQueryBuilder('mul')
      //         .leftJoinAndSelect('mul.user', 'user')
      //         .leftJoinAndSelect('mul.movie', 'movie')
      //         .where('movie.id IN(:...movieIds)', { movieIds })
      //         .andWhere('user.id = :userId', { userId })
      //         .getMany();

      const likedMovieMap = likedMovies.reduce(
        (acc, next) => ({
          ...acc,
          [next.movie._id.toString()]: next.isLike,
        }),
        {},
      );

      return {
        data: movies.map((movie) => ({
          ...movie,
          likeStatus:
            movie._id.toString() in likedMovieMap
              ? likedMovieMap[movie._id.toString()]
              : null,
        })) as any,
        nextCursor,
        hasNextPage,
      };
      //   data = data.map((x) => ({
      //     ...x,
      //     /// null || true || false
      //     likeStatus: x.id in likedMovieMap ? likedMovieMap[x.id] : null,
      //   }));
    }
    return {
      data: movies,
      nextCursor,
      hasNextPage,
    };
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
    const movie = await this.movieModel.findById(id);
    return movie;
    // const movie = await this.movieRepository
    //   .createQueryBuilder('movie')
    //   .leftJoinAndSelect('movie.director', 'director')
    //   .leftJoinAndSelect('movie.genres', 'genres')
    //   .leftJoinAndSelect('movie.detail', 'detail')
    //   .leftJoinAndSelect('movie.creator', 'creator')
    //   .where('movie.id = :id', { id })
    //   .getOne();
    // if (!movie) {
    //   throw new NotFoundException('영화가 없습니다.');
    // }
    //
    // return movie;
    // const movie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail', 'director', 'genres'],
    // });
    // if (!movie) {
    //   throw new NotFoundException(`movie not Found.`);
    // }
    // return movie;
  }

  /**
   * prisma 를 사용한 create 함수
   * @param createMovieDto
   * @param userId
   */
  async create(createMovieDto: CreateMovieDto, userId: number) {
    /**
     * mongoose 로 트랜잭션 세션 열어줌
     */
    const session = await this.movieModel.startSession();
    session.startTransaction();
    try {
      const director = await this.directorModel
        .findById(createMovieDto.directorId)
        .exec();
      if (!director) {
        throw new NotFoundException(`존재하지 않는 감독입니다.`);
      }
      const genres = await this.genreModel
        .find({
          _id: { $in: createMovieDto.genreIds },
        })
        .exec();
      if (genres.length !== createMovieDto.genreIds.length) {
        throw new NotFoundException(
          `존재하지 않는 장르입니다. 존재 : ${genres.map((genre) => genre.id).join(',')}`,
        );
      }

      const movieDetail = await this.movieDetailModel.create(
        [
          {
            detail: createMovieDto.detail,
          },
        ],
        {
          session,
        },
      );

      const movie = await this.movieModel.create([
        {
          title: createMovieDto.title,
          movieFilePath: createMovieDto.movieFileName,
          creator: userId,
          director: director._id,
          genres: genres.map((genre) => genre._id),
          detail: movieDetail[0]._id,
        },
        {
          session,
        },
      ]);
      await session.commitTransaction();
      return this.movieModel
        .findById(movie[0]._id)
        .populate('detail director genre')
        .exec();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }

    // return this.prisma.$transaction(async (prisma) => {
    // const director = await prisma.director.findUnique({
    //   where: {
    //     id: createMovieDto.directorId,
    //   },
    // });
    // if (!director) {
    //   throw new NotFoundException(`존재하지 않는 감독입니다.`);
    // }
    // const genres = await prisma.genre.findMany({
    //   where: {
    //     id: {
    //       in: createMovieDto.genreIds,
    //     },
    //   },
    // });
    // if (genres.length !== createMovieDto.genreIds.length) {
    //   throw new NotFoundException(
    //     `존재하지 않는 장르입니다. 존재 : ${genres.map((genre) => genre.id).join(',')}`,
    //   );
    // }
    // const movieDetail = await prisma.movieDetail.create({
    //   data: { detail: createMovieDto.detail },
    // });

    // const movie = await prisma.movie.create({
    //   data: {
    //     title: createMovieDto.title,
    //     movieFilePath: createMovieDto.movieFileName,
    //     creator: { connect: { id: userId } },
    //     director: { connect: { id: director.id } },
    //     genres: { connect: genres.map((genre) => ({ id: genre.id })) },
    //     detail: { connect: { id: movieDetail.id } },
    //   },
    // });
    // return prisma.movie.findUnique({
    //   where: {
    //     id: movie.id,
    //   },
    //   include: {
    //     detail: true,
    //     director: true,
    //     genres: true,
    //   },
    // });
    // });
  }

  // async create(
  //   createMovieDto: CreateMovieDto,
  //   userId: number,
  //   qr: QueryRunner,
  // ) {
  // const director = await qr.manager.findOne(Director, {
  //   where: {
  //     id: createMovieDto.directorId,
  //   },
  // });
  // if (!director) {
  //   throw new NotFoundException(`존재하지 않는 감독입니다.`);
  // }
  // const genres = await qr.manager.find(Genre, {
  //   where: {
  //     id: In(createMovieDto.genreIds),
  //   },
  // });
  // if (genres.length !== createMovieDto.genreIds.length) {
  //   throw new NotFoundException(
  //     `존재하지 않는 장르입니다. 존재 : ${genres.map((genre) => genre.id).join(',')}`,
  //   );
  // }
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
  // const movieDetail = await qr.manager
  //   .createQueryBuilder()
  //   .insert()
  //   .into(MovieDetail)
  //   .values({
  //     detail: createMovieDto.detail,
  //   })
  //   .execute();
  // 2. 디테일의 id를 가지고옴. identifiers는 리스트로 아이디를 가지고 와줌.
  // const movieDetailId = movieDetail.identifiers[0].id;
  // const movieFolder = join('public', 'movie');
  // const tempFolder = join('public', 'temp');
  // 3. detail에 생성된 아이디를 넣어주면서 무비를 생성함.
  // const movie = await qr.manager
  //   .createQueryBuilder()
  //   .insert()
  //   .into(Movie)
  //   .values({
  //     title: createMovieDto.title,
  //     detail: { id: movieDetailId },
  //     creator: {
  //       id: userId,
  //     },
  //     movieFilePath: join(movieFolder, createMovieDto.movieFileName),
  //     director, // 얘는 이미 생성되어 있는걸 가지고와서 쓰는거기 때문에 바로 insert 가능.
  //     // genres, // 이미 존재하지만 many to many 관계는 바로 insert 불가.
  //   })
  //   .execute();
  // 4. 생성된 무비의 아이디를 가지고옴.
  // const movieId = await movie.identifiers[0].id;
  // 5. many to many 관계설정은 이렇게 따로 해줘야함.
  // await qr.manager
  //   .createQueryBuilder()
  //   .relation(Movie, 'genres') // 무비와 어떤 테이블의 관계를 설정할지 ?
  //   .of(movieId) // 어떤 값을 기준으로 ?
  //   .add(genres.map((genre) => genre.id));
  // await rename(
  //   join(process.cwd(), tempFolder, createMovieDto.movieFileName),
  //   join(process.cwd(), movieFolder, createMovieDto.movieFileName),
  // );
  // return await qr.manager.findOne(Movie, {
  //   where: {
  //     id: movieId,
  //   },
  // relations: ['director', 'genres', 'detail'],
  // });
  // }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const session = await this.movieModel.startSession();
    session.startTransaction();

    try {
      const movie = await this.movieModel
        .findById(id)
        .populate('detail genres')
        .exec();
      if (!movie) {
        throw new NotFoundException(`존재하지 않는 영화 id 입니다.`);
      }
      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;
      const movieUpdateParams: {
        title?: string;
        movieFileName?: string;
        director?: Types.ObjectId;
        genres?: Types.ObjectId[];
      } = {
        ...movieRest,
      };
      if (directorId) {
        const director = await this.directorModel.findById(directorId).exec();
        if (!director) {
          throw new NotFoundException(`존재하지 않는 감독입니다.`);
        }
        movieUpdateParams.director = director._id as Types.ObjectId;
      }

      if (genreIds) {
        const genres = await this.genreModel
          .find({
            _id: { $in: genreIds },
          })
          .exec();
        if (genres.length !== genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다. ${genres.map((genre) => genre.id).join(',')}`,
          );
        }
        movieUpdateParams.genres = genres.map(
          (genre) => genre._id,
        ) as Types.ObjectId[];
      }
      if (detail) {
        await this.movieDetailModel
          .findByIdAndUpdate(movie.detail._id, {
            detail,
          })
          .exec();
      }
      await this.movieModel.findByIdAndUpdate(id, movieUpdateParams);
      await session.commitTransaction();
      return this.movieModel
        .findById(id)
        .populate('detail director genres')
        .exec();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }
    // return this.prisma.$transaction(async (prisma) => {
    // const movie = await prisma.movie.findUnique({
    //   where: { id },
    //   include: {
    //     detail: true,
    //     genres: true,
    //   },
    // });
    // if (!movie) {
    //   throw new NotFoundException(`존재하지 않는 영화 id 입니다.`);
    // }
    // const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;
    // const movieUpdateParams: Prisma.MovieUpdateInput = {
    //   ...movieRest,
    // };
    // if (directorId) {
    // const director = await prisma.director.findUnique({
    //   where: {
    //     id: directorId,
    //   },
    // });
    // if (!director) {
    //   throw new NotFoundException(`존재하지 않는 감독입니다.`);
    // }
    // movieUpdateParams.director = { connect: { id: directorId } };
    // }
    // if (genreIds) {
    // const genres = await prisma.genre.findMany({
    //   where: { id: { in: genreIds } },
    // });
    // if (genres.length !== genreIds.length) {
    //   throw new NotFoundException(
    //     `존재하지 않는 장르가 있습니다. ${genres.map((genre) => genre.id).join(',')}`,
    //   );
    // }
    // movieUpdateParams.genres = {
    //   set: genres.map((genre) => ({ id: genre.id })),
    // };
    // }
    //   await prisma.movie.update({
    //     where: { id },
    //     data: movieUpdateParams,
    //   });
    //   if (detail) {
    //     await prisma.movieDetail.update({
    //       where: { id: movie.detail.id },
    //       data: { detail },
    //     });
    //   }
    //   return prisma.movie.findUnique({
    //     where: { id },
    //     include: {
    //       detail: true,
    //       director: true,
    //       genres: true,
    //     },
    //   });
    // });
  }

  // async update(id: number, updateMovieDto: UpdateMovieDto) {
  //   const qr = this.dataSource.createQueryRunner();
  //   await qr.connect();
  //   await qr.startTransaction();
  //   try {
  // const movie = await qr.manager.findOne(Movie, {
  //   where: {
  //     id,
  //   },
  //   relations: ['detail', 'genres'],
  // });
  // if (!movie) {
  //   throw new NotFoundException(`존재ㅏ지 않는 영화 id임`);
  // }

  // const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;
  // let newDirector;
  // if (directorId) {
  //   const director = await qr.manager.findOne(Director, {
  //     where: {
  //       id: directorId,
  //     },
  //   });
  //   if (!director) {
  //     throw new NotFoundException(`존재하지 않는 감독입니다.`);
  //   }
  //   newDirector = director;
  // }

  // let newGenres;
  // if (genreIds) {
  //   const genres = await qr.manager.find(Genre, {
  //     where: {
  //       id: In(genreIds),
  //     },
  //   });
  //   if (genres.length !== updateMovieDto.genreIds.length) {
  //     throw new NotFoundException(`
  //   존재하지 않는 장르가 있음 : ${genres.map((genre) => genre.id).join(',')}`);
  //   }
  //   newGenres = genres;
  // }

  // const movieUpdateFields = {
  //   ...movieRest,
  //   ...(newDirector && { director: newDirector }),
  // };
  //
  // await qr.manager
  //   .createQueryBuilder()
  //   .update(Movie)
  //   .set(movieUpdateFields)
  //   .where('id = :id', { id })
  //   .execute();
  //
  // // await this.movieRepository.update({ id }, movieUpdateFields);
  //
  // if (detail) {
  //   await qr.manager
  //     .createQueryBuilder()
  //     .update(MovieDetail)
  //     .set({ detail })
  //     .where('id = :id', { id: movie.detail.id })
  //     .execute();
  //
  //   // await this.movieDetailRepository.update(
  //   //   { id: movie.detail.id },
  //   //   { detail },
  //   // );
  // }
  //
  // if (newGenres) {
  //   await qr.manager
  //     .createQueryBuilder()
  //     .relation(Movie, 'genres')
  //     .of(id)
  //     .addAndRemove(
  //       newGenres.map((genre) => genre.id),
  //       movie.genres.map((genre) => genre.id),
  //     );
  // }

  // repository method를 사용해서 many to many 관계의 장르를 업데이트 해줌.
  // const newMovie = await this.movieRepository.findOne({
  //   where: { id },
  //   relations: ['detail', 'director', 'genres'],
  // });
  // newMovie.genres = newGenres;
  // await this.movieRepository.save(newMovie);

  //     await qr.commitTransaction();
  //
  //     return this.movieRepository.findOne({
  //       where: { id },
  //       relations: ['detail', 'director', 'genres'],
  //     });
  //   } catch (e) {
  //     await qr.rollbackTransaction();
  //     throw e;
  //   } finally {
  //     await qr.release();
  //   }
  // }

  async remove(id: number) {
    const movie = await this.movieModel.findById(id).populate('detail').exec();
    // const movie = await this.prisma.movie.findUnique({
    //   where: {
    //     id,
    //   },
    //   include: {
    //     detail: true,
    //   },
    // });
    // const movie = await this.movieRepository.findOne({
    //   where: {
    //     id,
    //   },
    //   relations: ['detail'],
    // });
    if (!movie) {
      throw new NotFoundException(`존재하지 않는 영화 id`);
    }

    // await this.movieRepository
    //   .createQueryBuilder()
    //   .delete()
    //   .where('id = :id', { id })
    //   .execute();

    // await this.movieRepository.delete(id);
    await this.movieModel.findByIdAndDelete(id).exec();
    await this.movieDetailModel.findByIdAndDelete(movie.detail._id).exec();
    // await this.prisma.movie.delete({
    //   where: { id: movie.detail.id },
    // });
    // await this.movieDetailRepository.delete(movie.detail.id);
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.movieModel.findById(movieId);
    // const movie = await this.prisma.movie.findUnique({
    //   where: {
    //     id: movieId,
    //   },
    // });
    // const movie = await this.movieRepository.findOne({
    //   where: {
    //     id: movieId,
    //   },
    // });
    if (!movie) {
      throw new BadRequestException('존재하지 않는 영화입니다. ');
    }

    const user = await this.userModel.findById(userId);
    // const user = await this.prisma.user.findUnique({
    //   where: {
    //     id: userId,
    //   },
    // });
    // const user = await this.userRepository.findOne({
    //   where: {
    //     id: userId,
    //   },
    // });
    if (!user) {
      throw new UnauthorizedException('사용자 정보가 없습니다.');
    }

    const likeRecord = await this.movieUserLikeModel.findOne({
      movie: movieId,
      user: userId,
    });
    // const likeRecord = await this.prisma.movieUserLike.findUnique({
    //   where: {
    //     movieId_userId: { movieId, userId },
    //   },
    // });
    // const likeRecord = await this.movieUserLikeRepository
    //   .createQueryBuilder('mul')
    //   .leftJoinAndSelect('mul.movie', 'movie')
    //   .leftJoinAndSelect('mul.user', 'user')
    //   .where('movie.id = :movieId', { movieId })
    //   .andWhere('user.id = :userId', { userId })
    //   .getOne();

    if (likeRecord) {
      if (isLike === likeRecord.isLike) {
        await this.movieUserLikeModel.findByIdAndDelete(likeRecord._id);
        // await this.prisma.movieUserLike.delete({
        //   where: {
        //     movieId_userId: { movieId, userId },
        //   },
        // });
        // await this.movieUserLikeRepository.delete({ movie, user });
      } else {
        likeRecord.isLike = isLike;
        likeRecord.save();
        // await this.movieUserLikeModel.findByIdAndUpdate(likeRecord._id, {
        //   isLike,
        // });
        // await this.prisma.movieUserLike.update({
        //   where: {
        //     movieId_userId: { movieId, userId },
        //   },
        //   data: {
        //     isLike,
        //   },
        // });
        // await this.movieUserLikeRepository.update({ movie, user }, { isLike });
      }
    } else {
      await this.movieUserLikeModel.create({
        movie: movieId,
        user: userId,
        isLike,
      });
      // await this.prisma.movieUserLike.create({
      //   data: {
      //     movie: { connect: { id: movieId } },
      //     user: { connect: { id: userId } },
      //     isLike,
      //   },
      // });
      // await this.movieUserLikeRepository.save({ movie, user, isLike });
    }

    const result = await this.movieUserLikeModel.findOne({
      movie: movieId,
      user: userId,
    });
    // const result = await this.prisma.movieUserLike.findUnique({
    //   where: {
    //     movieId_userId: { movieId, userId },
    //   },
    // });
    // const result = await this.movieUserLikeRepository
    //   .createQueryBuilder('mul')
    //   .leftJoinAndSelect('mul.movie', 'movie')
    //   .leftJoinAndSelect('mul.user', 'user')
    //   .where('movie.id = :movieId', { movieId })
    //   .andWhere('user.id = :userId', { userId })
    //   .getOne();

    return {
      isLike: result && result.isLike,
    };
  }
}
