/**
 * partialType을 nestjs/mapped-types에서 불러오면 swagger에
 * dto의 형식이 안나옴. => partialType을 swagger에서 불러오면 해결 !
 */
// import { PartialType } from '@nestjs/mapped-types';
import { PartialType } from '@nestjs/swagger';
import { CreateMovieDto } from './create-movie.dto';
import {
  ArrayNotEmpty,
  Equals,
  IsAlphanumeric,
  IsArray,
  IsBoolean,
  IsCreditCard,
  IsDateString,
  IsDefined,
  IsDivisibleBy,
  IsEnum,
  IsHexColor,
  IsIn,
  IsLatLong,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  NotContains,
  NotEquals,
  registerDecorator,
  Validate,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { number } from 'joi';

enum MovieGenre {
  Fantasy = 'fantasy',
  Action = 'action',
}
// validator를 만들어서 사용할 수도 있음 -> ValidatorConstraintInterface를 implement 해야함
@ValidatorConstraint()
class emailAddressValidator implements ValidatorConstraintInterface {
  // validate() 와 defaultMessage() 를 사용하면됨.
  validate(
    value: any,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> | boolean {
    if (typeof value !== 'string') return false;
    return value.endsWith('@naver.com');
  }
  defaultMessage(validationArguments?: ValidationArguments): string {
    return '메일 주소의 도메인은 @naver.com 이어야합니다. 입력된값 : ($value)';
  }
}

/**
 * @Validator(여기에 클래스이름)
 * 이렇게 선언할 수도 있고
 * 저걸 합쳐서 IsPasswordValid 함수를 만들어서 클래스와 함께 사용할 수도 있음.
 */
function IsEmailValidate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      // target, propertyName, options는 default로 작성해줘야 하는 값임
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: emailAddressValidator,
    });
  };
}

/**
 * PartialType 사용하면 CreateMovieDto 값들을 모두 optional 하게 받아줌
 */
export class UpdateMovieDto extends PartialType(CreateMovieDto) {
  // @IsDefined()    // null 이나 undefined를 체크함
  // @Equals('code factory')  // 동일한 문자열만 넣을수 있음
  // @NotEquals('code factory')
  // @IsEmpty()  // null || undefined || '' 중 하나여야함
  // @IsIn(['action', 'fantasy']) // 'action', 'fantasy' 중 하나의 값이어야함
  // @IsBoolean()
  // @IsString()
  // @IsDateString()
  // @IsEnum(MovieGenre)
  // @IsDivisibleBy(5) // 5로 나눌 수 있는 값인가
  // @IsPositive() // 양수인가!?
  // @NotContains('code factory')
  // @IsAlphanumeric() // 알파벳과 숫자만 허용
  // @IsCreditCard()
  // @IsHexColor() //  hex color code 인지
  // @MaxLength(16)
  // @MinLength(4)
  // @IsUUID() // uuid 인지 확인
  // @IsLatLong() // 위도 경도인지
  // @Validate(PasswordValidator, {
  //        message: '메세지 넣어줄 수 도 있음.'
  //     }
  // )
  //@IsPasswordValid()
  // @Validate(emailAddressValidator)
  // @IsEmailValidate()
  // email: string;
}
