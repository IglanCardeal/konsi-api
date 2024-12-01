export interface ILogger {
  info(message: string, data?: any): void;
  error(message: string, error?: Error): void;
}
