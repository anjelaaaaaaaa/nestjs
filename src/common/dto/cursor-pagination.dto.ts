import { IsArray, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
  @IsOptional()
  /**
   * 실제 정렬에 필요한 값들을 받을 것임
   * id_52, likeCount_28
   */
  cursor: string;

  @IsArray()
  @IsString({
    each: true,
  })
  /**
   * id_ASC id_DESC
   * [id_DESC, likeCount_DESC] 이런식으로 받을것임
   */
  order: string[] = ['id_DESC'];

  @IsInt()
  @IsOptional()
  take?: number = 5;
}
