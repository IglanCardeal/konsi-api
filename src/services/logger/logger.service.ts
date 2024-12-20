import { ILogger } from 'src/shared/logger/logger.interface';

export class LoggerService implements ILogger {
  private readonly loggers: ILogger[];

  constructor(loggers: ILogger[] = []) {
    this.loggers = loggers.length ? loggers : [console];
  }

  info(message: string, data?: any): void {
    this.loggers.forEach((logger) => logger.info(message, data));
  }

  error(message: string, error?: Error): void {
    this.loggers.forEach((logger) => logger.error(message, error));
  }
}
