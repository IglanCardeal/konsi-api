import { Body, Controller, Put } from '@nestjs/common';
import { ProcessBenefitsByDocumentUseCase } from './process-benefits-by-document.usecase';
import { ProcessBenefitsByDocumentDTO } from './process-benefits-by-document.dto';

@Controller('process-by-document')
export class ProcessBenefitsByDocumentController {
  constructor(
    private readonly processBenefitsByDocumentUseCase: ProcessBenefitsByDocumentUseCase,
  ) {}

  @Put()
  async processBenefitsByDocument(
    @Body() payload: ProcessBenefitsByDocumentDTO,
  ) {
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
