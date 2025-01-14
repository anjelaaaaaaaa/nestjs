import { IsArray, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CursorPaginationDto {
  @IsOptional()
  /**
   * 실제 정렬에 필요한 값들을 받을 것임
   * id_52, likeCount_28
   */
  @ApiProperty({
    description: '페이지네이션 커서',
    example: 'eyJ2YWx1ZXMiOnsiaWQiOjJ9LCJvcmRlciI6WyJpZF9ERVNDIl19',
  })
  cursor?: string;

  @IsArray()
  @IsString({
    each: true,
  })
  @IsOptional()
  @ApiProperty({
    description: '내림차 또는 오름차 정렬',
    example: 'id_DESC',
  })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value])) // swagger에서 array 타입을 못받아와서 transform 해줌
  /**
   * id_ASC id_DESC
   * [id_DESC, likeCount_DESC] 이런식으로 받을것임
   */
  order?: string[] = ['id_DESC'];

  @IsInt()
  @IsOptional()
  @ApiProperty({
    description: '가져올 데이터 갯수',
    example: 3,
  })
  take?: number = 2;
}
