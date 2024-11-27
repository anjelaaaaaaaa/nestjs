import { PagePaginationDto } from '../../common/dto/page-pagination.dto';
import { IsOptional, IsString } from 'class-validator';
import { CursorPaginationDto } from '../../common/dto/cursor-pagination.dto';

export class GetMoviesDto extends CursorPaginationDto {
  @IsString()
  @IsOptional()
  title?: string;
}
