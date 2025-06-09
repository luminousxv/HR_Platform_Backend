import { IsEnum, IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { LeaveType } from '../enums/leave-type.enum';

export class CreateLeaveRequestDto {
  @IsEnum(LeaveType)
  @IsNotEmpty()
  leaveType: LeaveType;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
