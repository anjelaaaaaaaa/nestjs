import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

export class BaseTable {
  @CreateDateColumn()
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn()
  @Exclude()
  updatedAt: Date;

  @VersionColumn()
  @Exclude()
  version: number;
}
