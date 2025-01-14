import { Module } from '@nestjs/common';
import { DirectorService } from './director.service';
import { DirectorController } from './director.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { Director } from './entity/director.entity';
import { CommonModule } from '../common/common.module';
import { Director, DirectorSchema } from './schema/director.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    // TypeOrmModule.forFeature([Director]),
    MongooseModule.forFeature([
      {
        name: Director.name,
        schema: DirectorSchema,
      },
    ]),
    CommonModule,
  ],
  controllers: [DirectorController],
  providers: [DirectorService],
})
export class DirectorModule {}
