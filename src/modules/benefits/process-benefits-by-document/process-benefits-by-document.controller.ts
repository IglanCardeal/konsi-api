import { Body, Controller, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProcessBenefitsByDocumentUseCase } from './process-benefits-by-document.usecase';
import {
  ProcessBenefitsByDocumentDTO,
  ProcessBenefitsByDocumentResponseDTO,
} from './process-benefits-by-document.dto';

@ApiTags('Benefits')
@Controller('process-documents')
export class ProcessBenefitsByDocumentController {
  constructor(
    private readonly processBenefitsByDocumentUseCase: ProcessBenefitsByDocumentUseCase,
  ) {}

  @Put()
  @ApiOperation({
    summary: 'Process benefits by documents',
    description: 'Process benefits information for a list of CPF documents',
  })
  @ApiResponse({
    status: 200,
    description: 'Benefits processing initiated successfully',
    type: ProcessBenefitsByDocumentResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid document format or empty array',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async processBenefitsByDocument(
    @Body() payload: ProcessBenefitsByDocumentDTO,
  ): Promise<ProcessBenefitsByDocumentResponseDTO> {
    let success = false;
    try {
      await this.processBenefitsByDocumentUseCase.execute(payload);
      success = true;
    } catch {
      success = false;
    }
    return { success };
  }
}
