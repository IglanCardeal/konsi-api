import { Module } from '@nestjs/common';
import { ProcessBenefitsByDocumentController } from './process-benefits-by-document/process-benefits-by-document.controller';
import { RouterModule } from '@nestjs/core';
import { ProcessBenefitsByDocumentUseCase } from './process-benefits-by-document/process-benefits-by-document.usecase';
import { QueueModule } from 'src/services/queue/queue.module';
import { LoggerService } from 'src/services/logger/logger.service';

const BENEFITS_ROUTE_PATH = 'benefits';

@Module({
  imports: [
    RouterModule.register([
      {
        path: BENEFITS_ROUTE_PATH,
        module: BenefitsModule,
      },
    ]),
    QueueModule,
  ],
  controllers: [ProcessBenefitsByDocumentController],
  providers: [
    ProcessBenefitsByDocumentUseCase,
    {
      provide: 'logger',
      useFactory: () => new LoggerService(),
    },
  ],
})
export class BenefitsModule {}
