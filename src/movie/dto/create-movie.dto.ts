import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

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
  genreIds: number[];
}
