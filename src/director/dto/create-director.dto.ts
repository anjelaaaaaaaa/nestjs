import { IsDate, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateDirectorDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsDate() // main.ts에 transformoption에 설정되어 있으므로 date string 넘어와도 바로 date 타입으로 변경해주어서 @IsDate 검사에도 잘 넘어감
  dob: Date;

  @IsNotEmpty()
  nationality: string;
}
