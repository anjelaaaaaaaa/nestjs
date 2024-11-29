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
import { ApiProperty } from '@nestjs/swagger';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '영화제목',
    example: '겨울왕국',
  })
  title: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '영화설명',
    example: '재밌음 ',
  })
  detail: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: '감독 객체 아이디',
    example: 1,
  })
  directorId: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber(
    {},
    {
      each: true,
    },
  )
  @ApiProperty({
    description: '장르 IDs',
    example: [1, 2, 3],
  })
  // formdata로 보낼때는 자동으로 number로 안보내주기때문에 타입 변환 직접 해야함
  @Type(() => Number)
  genreIds: number[];

  @IsString()
  @ApiProperty({
    description: '영화파일이름',
    example: 'aaa-bbb-ccc-ddd.jpg',
  })
  movieFileName: string;
}
