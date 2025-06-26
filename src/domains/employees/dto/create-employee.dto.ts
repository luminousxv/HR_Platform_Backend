import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsUUID,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { EmploymentType } from '../enums/employment-type.enum';
import { EmploymentStatus } from '../enums/employment-status.enum';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  employeeNumber: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  joinDate: string;

  @IsString()
  @IsNotEmpty()
  residentRegistrationNumber: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsEnum(EmploymentType)
  @IsNotEmpty()
  employmentType: EmploymentType;

  @IsEnum(EmploymentStatus)
  @IsNotEmpty()
  status: EmploymentStatus;

  @IsDateString()
  @IsOptional()
  resignationDate?: string | null;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  bankAccountNumber: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  baseSalary?: number;

  @IsDateString()
  @IsOptional()
  effectiveDate?: string;
}
