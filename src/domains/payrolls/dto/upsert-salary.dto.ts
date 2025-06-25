import {
  IsNumber,
  IsPositive,
  IsDateString,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

class EarningItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsBoolean()
  @IsOptional()
  isTaxable?: boolean;
}

class DeductionItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}

export class UpsertSalaryDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  baseSalary: number; // 월 기본급

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EarningItemDto)
  @IsOptional()
  earnings?: EarningItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeductionItemDto)
  @IsOptional()
  deductions?: DeductionItemDto[];

  @IsDateString()
  @IsNotEmpty()
  effectiveDate: string; // 적용 시작일
}
