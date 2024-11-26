import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseTable } from '../../common/entity/base.table';
import { Exclude } from 'class-transformer';

export enum Role {
  admin,
  paidUser,
  user,
}
@Entity()
export class User extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  @Exclude({
    // toClassOnly 요청을 받을때
    toPlainOnly: true, // 응답보낼때
  })
  password: string;

  @Column({
    enum: Role,
    default: Role.user,
  })
  role: Role;
}
