import { Controller, Get, Query } from '@nestjs/common';
import { ConsultBenefitsUseCase } from './consult-benefits.usecase';
import {
  ConsultBenefitsDTO,
  ConsultBenefitsResponseDTO,
} from './consult-benefits.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('benefits')
@Controller('consult-benefits')
export class ConsultBenefitsController {
  constructor(
    private readonly consultBenefitsUseCase: ConsultBenefitsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Consult benefits',
    description: 'Endpoint to consult benefits information',
  })
  @ApiResponse({
    status: 200,
    description: 'Benefits successfully retrieved',
    type: ConsultBenefitsResponseDTO,
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found',
  })
  async consultBenefits(@Query() payload: ConsultBenefitsDTO) {
    return this.consultBenefitsUseCase.execute(payload);
  }
}
