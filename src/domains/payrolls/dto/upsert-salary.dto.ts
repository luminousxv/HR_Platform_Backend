import {
  IsNumber,
  IsPositive,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';

export class UpsertSalaryDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  baseSalary: number; // 월 기본급

  @IsDateString()
  @IsNotEmpty()
  effectiveDate: string; // 적용 시작일
}
