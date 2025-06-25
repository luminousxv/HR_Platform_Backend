import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payroll } from './entities/payroll.entity';
import { Salary } from './entities/salary.entity';
import { Employee } from '../employees/entities/employee.entity';
import { UpsertSalaryDto } from './dto/upsert-salary.dto';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PayrollsService {
  constructor(
    @InjectRepository(Payroll)
    private payrollRepository: Repository<Payroll>,
    @InjectRepository(Salary)
    private salaryRepository: Repository<Salary>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async upsertSalary(
    employeeId: string,
    upsertSalaryDto: UpsertSalaryDto,
  ): Promise<Salary> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException(
        `ID가 ${employeeId}인 직원을 찾을 수 없습니다.`,
      );
    }

    let salary = await this.salaryRepository.findOne({
      where: { employeeId },
    });

    if (salary) {
      // 급여 정보 업데이트
      Object.assign(salary, upsertSalaryDto);
    } else {
      // 급여 정보 생성
      salary = this.salaryRepository.create({
        ...upsertSalaryDto,
        employee,
      });
    }

    return this.salaryRepository.save(salary);
  }

  async generatePayrolls(
    generatePayrollDto: GeneratePayrollDto,
  ): Promise<{ count: number }> {
    const { year, month } = generatePayrollDto;
    const paymentMonth = `${year}-${String(month).padStart(2, '0')}-01`;

    // 해당 월에 이미 생성된 명세서가 있는지 확인
    const existingPayroll = await this.payrollRepository.findOne({
      where: { paymentMonth },
    });
    if (existingPayroll) {
      throw new ConflictException(
        `${year}년 ${month}월의 급여 명세서가 이미 존재합니다.`,
      );
    }

    // 모든 재직중인 직원 조회
    const activeEmployees = await this.employeeRepository.find({
      relations: ['salary'],
    });

    const payrollsToCreate: Payroll[] = [];

    for (const employee of activeEmployees) {
      if (!employee.salary || !employee.salary.baseSalary) {
        // 급여 정보가 없는 직원은 건너뜀 (또는 에러 처리)
        console.warn(
          `직원 ${employee.name}(${employee.id})의 급여 정보가 없어 급여 생성을 건너뜁니다.`,
        );
        continue;
      }

      const baseSalary = employee.salary.baseSalary;

      // (MVP) 단순화된 공제 계산 로직
      const nationalPension = baseSalary * 0.045; // 국민연금 (4.5%)
      const healthInsurance = baseSalary * 0.03545; // 건강보험 (3.545%)
      const employmentInsurance = baseSalary * 0.009; // 고용보험 (0.9%)
      const incomeTax =
        (baseSalary - nationalPension - healthInsurance - employmentInsurance) *
        0.1; // 소득세 (간단히 10%)

      const totalDeductions =
        nationalPension + healthInsurance + employmentInsurance + incomeTax;
      const netPay = baseSalary - totalDeductions;

      const payroll = this.payrollRepository.create({
        employeeId: employee.id,
        paymentMonth,
        baseSalary,
        bonus: 0, // MVP에서는 보너스 0으로 가정
        nationalPension,
        healthInsurance,
        employmentInsurance,
        incomeTax,
        totalDeductions,
        netPay,
      });

      payrollsToCreate.push(payroll);
    }

    await this.payrollRepository.save(payrollsToCreate);

    return { count: payrollsToCreate.length };
  }

  async findMyPayrolls(user: User): Promise<Payroll[]> {
    const employee = await this.employeeRepository.findOne({
      where: { userId: user.id },
    });
    if (!employee) {
      throw new NotFoundException('해당 직원을 찾을 수 없습니다.');
    }

    return this.payrollRepository.find({
      where: { employeeId: employee.id },
      order: { paymentMonth: 'DESC' },
    });
  }
}
