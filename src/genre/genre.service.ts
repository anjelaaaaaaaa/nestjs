import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
// import { Genre } from './entity/genre.entity';
import { Repository } from 'typeorm';
import { PrismaService } from '../common/prisma.service';
import { InjectModel } from '@nestjs/mongoose';
import { Genre } from './schema/genre.schema';
import { Model } from 'mongoose';

@Injectable()
export class GenreService {
  constructor(
    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,
    // private readonly prisma: PrismaService,
    @InjectModel(Genre.name)
    private readonly genreModel: Model<Genre>,
  ) {}

  async create(createGenreDto: CreateGenreDto) {
    // const genre = await this.prisma.genre.findUnique({
    //   where: {
    //     name: createGenreDto.name,
    //   },
    // });
    // const genre = await this.genreRepository.findOne({
    //   where: {
    //     name: createGenreDto.name,
    //   },
    // });
    // if (genre) {
    //   throw new BadRequestException(`존재하는 장르입니다.`);
    // }

    const result = await this.genreModel.create(createGenreDto);
    return result.toObject();

    /**
     * _id를 transform 하는 것을 Schema에서 할 수 있음.
     */
    // return result.toObject({
    //   transform: (model, ret) => {
    //     ret._id = ret._id.toString();
    //     return ret;
    //   },
    // });

    // return {
    //   ...result.toObject(),
    //   _id: result._id.toString(),
    // };
    // return this.genreModel.create(createGenreDto);
    // return this.prisma.genre.create({
    //   data: createGenreDto,
    // });
    // return this.genreRepository.save(createGenreDto);
  }

  findAll() {
    return this.genreModel.find().exec();
    // return this.prisma.genre.findMany();
    // return this.genreRepository.find();
  }

  async findOne(id: string) {
    const genre = await this.genreModel.findById(id).exec();
    if (!genre) {
      throw new NotFoundException(`존재하지 않는 장르입니다!`);
    }
    return genre;
    // return this.prisma.genre.findUnique({
    //   where: { id },
    // });
    // return this.genreRepository.findOne({
    //   where: { id },
    // });
  }

  async update(id: string, updateGenreDto: UpdateGenreDto) {
    const genre = await this.genreModel.findById(id).exec();
    // const genre = await this.prisma.genre.findUnique({
    //   where: { id },
    // });
    // const genre = await this.genreRepository.findOne({
    //   where: { id },
    // });
    if (!genre) {
      throw new NotFoundException(`존재하지 않는 장르입니다.`);
    }
    await this.genreModel.findByIdAndUpdate(id, updateGenreDto);
    // await this.prisma.genre.update({
    //   where: { id },
    //   data: { ...updateGenreDto },
    // });
    // await this.genreRepository.update({ id }, { ...updateGenreDto });
    const newGenre = await this.genreModel.findById(id);
    // const newGenre = await this.prisma.genre.findUnique({
    //   where: { id },
    // });
    // const newGenre = await this.genreRepository.findOne({
    //   where: { id },
    // });
    return newGenre;
  }

  async remove(id: string) {
    const genre = await this.genreModel.findById(id);
    // const genre = await this.prisma.genre.findUnique({
    //   where: { id },
    // });
    // const genre = await this.genreRepository.findOne({
    //   where: { id },
    // });
    if (!genre) {
      throw new NotFoundException(`존재하지 않는 장르입니다.`);
    }
    await this.genreModel.findByIdAndDelete(id);
    // await this.prisma.genre.delete({
    //   where: { id },
    // });
    // await this.genreRepository.delete(id);
    return id;
  }
}
