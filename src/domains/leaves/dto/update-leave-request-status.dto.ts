import { IsEnum, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { LeaveRequestStatus } from '../enums/leave-status.enum';

export class UpdateLeaveRequestStatusDto {
  @IsEnum(LeaveRequestStatus)
  @IsNotEmpty()
  status: LeaveRequestStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
