export const CONSTANTS = {
  elasticsearch: {
    benefitsIndex: 'benefits',
  },
  queue: {
    processDocumentsQueueName: 'process-benefits-by-document',
    processDocumentsQueueJobName: 'find-benefits',
  },
} as const;
