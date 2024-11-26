import { PagePaginationDto } from '../../common/dto/page-pagination.dto';
import { IsOptional, IsString } from 'class-validator';

export class GetMoviesDto extends PagePaginationDto {
  @IsString()
  @IsOptional()
  title?: string;
}
