import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { number } from 'joi';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  detail: string;

  @IsNotEmpty()
  @IsNumber()
  directorId: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber(
    {},
    {
      each: true,
    },
  )
  // formdata로 보낼때는 자동으로 number로 안보내주기때문에 타입 변환 직접 해야함
  @Type(() => Number)
  genreIds: number[];

  @IsString()
  movieFileName: string;
}
