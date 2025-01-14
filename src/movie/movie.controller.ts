import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { Public } from '../auth/decorator/public.decorator';
import { RBAC } from '../auth/decorator/rbac.decorator';
import { GetMoviesDto } from './dto/get-movies.dto';
import { TransactionInterceptor } from '../common/interceptor/transaction.interceptor';
import { UserId } from '../user/decorator/user-id.decorator';
import { QueryRunner } from '../common/decorator/query-runner.decorator';
import { QueryRunner as QR } from 'typeorm';
import { CacheInterceptor as CI, CacheKey } from '@nestjs/cache-manager';
import { Throttle } from '../common/decorator/throttle.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Role } from '@prisma/client';

@Controller({
  // path: 'movie',
  // version: '2',
})
export class MovieControllerV2 {
  @Get()
  gtMovies() {
    console.log('버전 투 호출 ');
    return 'version 2';
  }
}

@Controller(
  'movie',
  // {
  // path: 'movie',
  // // version: VERSION_NEUTRAL,  버전 뉴트럴로 진행하면 default가 생기는거임.
  // version: '1',
  // }
)
// class-transformer를 사용하려면 적용해야함
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth()
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Public()
  @Get()
  @Throttle({
    count: 5,
    unit: 'minute',
  })
  @ApiOperation({
    description: 'movie를 pagination 하는 api',
  })
  @ApiResponse({
    status: 200,
    description: '성공적으로 api pagination을 실행 했을 때',
  })
  @ApiResponse({
    status: 400,
    description: '에러',
  })
  // @Version('5') 이렇게 메서드에도 버전 설정해줄 수 있음.
  getMovies(@Query() dto: GetMoviesDto, @UserId() userId?: number) {
    return this.movieService.findAll(dto, userId);
  }

  @Get('recent')
  /**
   * cache-manager의 인터셉터를 사용하면 이 라우터의 url 자체를 캐싱해버림.
   * 그래서 만약에 페이지네이션같은거해서 쿼리 파라미터 같은거 붙어오면 그 url 대로 캐싱함. (파라미터 별로 캐싱된다는 뜻)
   */
  @UseInterceptors(CI)
  @CacheKey('getMoviesRecent') // 캐시키를 일괄적으로 적용. 쿼리 파라미터 변경되어도 호출은 한번만 됨.
  getMoviesRecent() {
    return this.movieService.findRecent();
  }

  @Public()
  @Get('/:id')
  getMovieById(@Param('id', ParseIntPipe) id: number, @Request() request: any) {
    const session = request.session;
    console.log(session);
    return this.movieService.findOne(id);
  }

  @RBAC(Role.admin)
  @Post()
  @UseGuards(AuthGuard)
  // @UseInterceptors(TransactionInterceptor)
  async createMovie(
    @Body() createMovieDto: CreateMovieDto,
    // @QueryRunner() queryRunner: QR,
    @UserId() userId: number,
    // @UploadedFile(여기에파이프적용가능)
  ) {
    return await this.movieService.create(
      createMovieDto,
      userId,
      // queryRunner
    );
  }

  @RBAC(Role.admin)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateMovieDto: UpdateMovieDto,
  ) {
    return this.movieService.update(+id, updateMovieDto);
  }

  @RBAC(Role.admin)
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.remove(id);
  }

  /**
   * [Like] [Dislike] 버튼 2개 존재
   */
  @Post(':id/like')
  createMovieLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  createMovieDislike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, false);
  }
}
