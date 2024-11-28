import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTable } from '../../common/entity/base.table';
import { MovieDetail } from './movie-detail.entity';
import { JoinColumn } from 'typeorm';
import { Transform } from 'class-transformer';
import { Director } from '../../director/entity/director.entity';
import { Genre } from '../../genre/entities/genre.entity';
import { User } from '../../user/entities/user.entity';
import { MovieUserLike } from './movie-user-like.entity';

// ManyToOne Director
// OneToOne MovieDetail
// ManyToMany Genre

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.createdMovies)
  creator: User;

  @Column({ unique: true })
  title: string;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  dislikeCount: number;

  @OneToOne(() => MovieDetail, (movieDetail) => movieDetail.id, {
    cascade: true,
    nullable: false,
  })
  @JoinColumn()
  detail: MovieDetail;

  @Column()
  // host url 도 붙여서 보내줌 ! get movie 할때
  @Transform(({ value }) => `http://localhost:3000/${value}`)
  movieFilePath: string;

  @ManyToOne(() => Director, (director) => director.movies, {
    cascade: true,
    nullable: false,
  })
  director: Director;

  @ManyToMany(() => Genre, (genre) => genre.movies)
  @JoinTable()
  genres: Genre[];

  @OneToMany(() => MovieUserLike, (mul) => mul.movie)
  likedUsers: MovieUserLike[];
}
