import { Module } from '@nestjs/common';
import { ProcessBenefitsByDocumentController } from './process-benefits-by-document/process-benefits-by-document.controller';
import { RouterModule } from '@nestjs/core';
import { ProcessBenefitsByDocumentUseCase } from './process-benefits-by-document/process-benefits-by-document.usecase';
import { QueueModule } from 'src/services/queue/queue.module';
import { LoggerService } from 'src/services/logger/logger.service';
import { ConsultBenefitsController } from './consult-benefits/consult-benefits.controller';
import { ConsultBenefitsUseCase } from './consult-benefits/consult-benefits.usecase';
import { ElasticModule } from 'src/services/elasticsearch/elasticsearch.module';

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
    ElasticModule,
  ],
  controllers: [ProcessBenefitsByDocumentController, ConsultBenefitsController],
  providers: [
    ProcessBenefitsByDocumentUseCase,
    {
      provide: 'logger',
      useFactory: () => new LoggerService(),
    },
    ConsultBenefitsUseCase,
  ],
})
export class BenefitsModule {}
