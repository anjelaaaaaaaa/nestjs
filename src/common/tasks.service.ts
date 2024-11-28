import { Injectable } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../movie/entity/movie.entity';
import { Logger } from '@nestjs/common';
import { DefaultLogger } from './logger/default.logger';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly schedulerRegistry: SchedulerRegistry,
    // private readonly logger: DefaultLogger,
  ) {}

  // @Cron('0 0 0 * * *')
  logEverySecond() {
    this.logger.fatal('FATAL level log');
    this.logger.error('ERROR level log');
    this.logger.warn('WARN level log');
    this.logger.log('LOG level log');
    this.logger.debug('DEBUG level log');
    this.logger.verbose('VERBOSE level log');
  }

  // @Cron('* * * * * *')
  async eraseOrphanFiles() {
    const files = await readdir(join(process.cwd(), 'public', 'temp'));

    const deleteFilesTargets = files.filter((file) => {
      const filename = parse(file).name; // extension 제외한 이름 넘어옴

      const split = filename.split('_');

      if (split.length !== 2) {
        return true; // 파일이름 이상하면 그냥 삭제 대상
      }

      try {
        const date = +new Date(parseInt(split[split.length - 1]));
        const aDayInMilSec = 24 * 60 * 60 * 1000;

        const now = +new Date();
        return now - date > aDayInMilSec;
      } catch (e) {
        return true;
      }
    });

    await Promise.all(
      deleteFilesTargets.map((x) =>
        unlink(join(process.cwd(), 'public', 'temp', x)),
      ),
    );
  }

  // @Cron('0 * * * * *')
  async calculateMovieLikeCounts() {
    await this.movieRepository.query(
      `UPDATE movie m SET "likeCount" = (SELECT count(*) from movie_user_like mul where m.id = mul."movieId" AND mul."isLike" = true)`,
    );

    await this.movieRepository.query(
      `UPDATE movie m SET "dislikeCount" = (SELECT count(*) from movie_user_like mul where m.id = mul."movieId" AND mul."isLike" = false)`,
    );
  }

  // @Cron('* * * * * *', {
  //   name: 'printer',
  // })
  printer() {
    console.log('print every seconds');
  }

  // @Cron('*/5 * * * * *')
  stopper() {
    console.log('----stopper run ----');

    const job = this.schedulerRegistry.getCronJob('printer');

    // console.log('# last date');
    // console.log(job.lastDate());
    // console.log('# next date');
    // console.log(job.nextDate());
    if (job.running) {
      job.stop();
    } else {
      job.start();
    }
  }
}
