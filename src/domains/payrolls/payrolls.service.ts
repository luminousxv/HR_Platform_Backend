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
import { PayrollDeduction } from './entities/payroll-deduction.entity';
import { DeductionType } from './enums/deduction-type.enum';

@Injectable()
export class PayrollsService {
  constructor(
    @InjectRepository(Payroll)
    private payrollRepository: Repository<Payroll>,
    @InjectRepository(PayrollDeduction)
    private payrollDeductionRepository: Repository<PayrollDeduction>,
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

    const existingPayroll = await this.payrollRepository.findOne({
      where: { paymentMonth },
    });
    if (existingPayroll) {
      throw new ConflictException(
        `${year}년 ${month}월의 급여 명세서가 이미 존재합니다.`,
      );
    }

    const activeEmployees = await this.employeeRepository.find({
      relations: ['salary'],
    });

    const payrollsToCreate: Payroll[] = [];

    for (const employee of activeEmployees) {
      if (!employee.salary || !employee.salary.baseSalary) {
        console.warn(
          `직원 ${employee.name}(${employee.id})의 급여 정보가 없어 급여 생성을 건너뜁니다.`,
        );
        continue;
      }

      const baseSalary = employee.salary.baseSalary;
      const deductions: PayrollDeduction[] = [];

      // (MVP) 단순화된 공제 계산 로직
      const nationalPension = baseSalary * 0.045;
      deductions.push(
        this.payrollDeductionRepository.create({
          type: DeductionType.NATIONAL_PENSION,
          amount: nationalPension,
        }),
      );

      const healthInsurance = baseSalary * 0.03545;
      deductions.push(
        this.payrollDeductionRepository.create({
          type: DeductionType.HEALTH_INSURANCE,
          amount: healthInsurance,
        }),
      );

      const employmentInsurance = baseSalary * 0.009;
      deductions.push(
        this.payrollDeductionRepository.create({
          type: DeductionType.EMPLOYMENT_INSURANCE,
          amount: employmentInsurance,
        }),
      );

      // 소득세 계산을 위한 과세 표준액
      const taxableIncome =
        baseSalary - nationalPension - healthInsurance - employmentInsurance;
      const incomeTax = taxableIncome > 0 ? taxableIncome * 0.1 : 0; // 소득세 (간단히 10%, 음수일 경우 0)
      deductions.push(
        this.payrollDeductionRepository.create({
          type: DeductionType.INCOME_TAX,
          amount: incomeTax,
        }),
      );

      const totalDeductions = deductions.reduce(
        (sum, d) => sum + Number(d.amount),
        0,
      );
      const netPay = baseSalary - totalDeductions;

      const payroll = this.payrollRepository.create({
        employeeId: employee.id,
        paymentMonth,
        baseSalary,
        bonus: 0,
        deductions,
        totalDeductions,
        netPay,
      });

      payrollsToCreate.push(payroll);
    }

    await this.payrollRepository.save(payrollsToCreate);

    return { count: payrollsToCreate.length };
  }

  async findAllPayrolls(year: number, month: number) {
    const paymentMonth = `${year}-${String(month).padStart(2, '0')}-01`;

    return this.payrollRepository.find({
      where: {
        paymentMonth: paymentMonth,
      },
      relations: ['employee', 'employee.user', 'deductions'],
      order: {
        employee: {
          name: 'ASC',
        },
      },
    });
  }

  async findOne(id: string): Promise<Payroll> {
    const payroll = await this.payrollRepository.findOne({
      where: { id },
      relations: ['employee', 'employee.user', 'deductions'],
    });
    if (!payroll) {
      throw new NotFoundException(`ID가 ${id}인 급여 정보를 찾을 수 없습니다.`);
    }
    return payroll;
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
      relations: ['deductions'],
      order: { paymentMonth: 'DESC' },
    });
  }

  async deleteByMonth(
    year: number,
    month: number,
  ): Promise<{ deletedCount: number }> {
    const paymentMonth = `${year}-${String(month).padStart(2, '0')}-01`;

    const deleteResult = await this.payrollRepository.delete({ paymentMonth });

    if (deleteResult.affected === 0) {
      throw new NotFoundException(
        `${year}년 ${month}월에 해당하는 급여 명세서가 없습니다.`,
      );
    }

    return { deletedCount: deleteResult.affected || 0 };
  }
}
