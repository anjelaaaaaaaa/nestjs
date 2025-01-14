import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Movie } from './movie.entity';
import { User } from '../../user/entity/user.entity';

/**
 * user와 movie의
 * many to many 관계를 테이블로 직접 만듦
 *
 * => 이 테이블(many)을 기준으로 movie와 user가 many to one 관계여야함
 *
 */
@Entity()
export class MovieUserLike {
  @PrimaryColumn({
    name: 'movieId',
    type: 'int8',
  })
  @ManyToOne(() => Movie, (movie) => movie.likedUsers, {
    onDelete: 'CASCADE',
  })
  movie: Movie;

  @PrimaryColumn({
    name: 'userId',
    type: 'int8',
  })
  @ManyToOne(() => User, (user) => user.likedMovies, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column()
  isLike: boolean;
}
