import { Body, Controller, Get } from '@nestjs/common';
import { ConsultBenefitsUseCase } from './consult-benefits.usecase';
import { ConsultBenefitsDTO } from './consult-benefits.dto';

@Controller('consult-benefits')
export class ConsultBenefitsController {
  constructor(
    private readonly consultBenefitsUseCase: ConsultBenefitsUseCase,
  ) {}

  @Get()
  async consultBenefits(@Body() payload: ConsultBenefitsDTO) {
    return this.consultBenefitsUseCase.execute(payload);
  }
}
