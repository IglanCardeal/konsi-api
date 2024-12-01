import { LoggerService } from '../logger.service';
import { ILogger } from 'src/shared/logger/logger.interface';

describe('LoggerService', () => {
  let service: LoggerService;

  class MockCustomLogger implements ILogger {
    info = jest.fn();
    error = jest.fn();
  }

  describe('Constructor', () => {
    it('should use console as default logger when no loggers provided', () => {
      const consoleSpy = jest.spyOn(console, 'info');
      service = new LoggerService();

      service.info('test message');

      expect(consoleSpy).toHaveBeenCalledWith('test message', undefined);
      consoleSpy.mockRestore();
    });

    it('should use provided loggers when available', () => {
      const mockLogger = new MockCustomLogger();
      service = new LoggerService([mockLogger]);

      service.info('test message');

      expect(mockLogger.info).toHaveBeenCalledWith('test message', undefined);
    });

    it('should handle multiple loggers', () => {
      const mockLogger1 = new MockCustomLogger();
      const mockLogger2 = new MockCustomLogger();
      service = new LoggerService([mockLogger1, mockLogger2]);

      service.info('test message');

      expect(mockLogger1.info).toHaveBeenCalledWith('test message', undefined);
      expect(mockLogger2.info).toHaveBeenCalledWith('test message', undefined);
    });
  });

  describe('info', () => {
    let mockLogger: MockCustomLogger;

    beforeEach(() => {
      mockLogger = new MockCustomLogger();
      service = new LoggerService([mockLogger]);
    });

    it('should call info on all loggers with the message', () => {
      const testMessage = 'test info message';
      const anyData = {};

      service.info(testMessage, anyData);

      expect(mockLogger.info).toHaveBeenCalledWith(testMessage, anyData);
      expect(mockLogger.info).toHaveBeenCalledTimes(1);
    });

    it('should handle empty message', () => {
      service.info('');

      expect(mockLogger.info).toHaveBeenCalledWith('', undefined);
    });

    it('should handle multiple calls', () => {
      service.info('message 1');
      service.info('message 2');

      expect(mockLogger.info).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenNthCalledWith(
        1,
        'message 1',
        undefined,
      );
      expect(mockLogger.info).toHaveBeenNthCalledWith(
        2,
        'message 2',
        undefined,
      );
    });
  });

  describe('error', () => {
    let mockLogger: MockCustomLogger;

    beforeEach(() => {
      mockLogger = new MockCustomLogger();
      service = new LoggerService([mockLogger]);
    });

    it('should call error on all loggers with message and error', () => {
      const testMessage = 'test error message';
      const testError = new Error('test error');

      service.error(testMessage, testError);

      expect(mockLogger.error).toHaveBeenCalledWith(testMessage, testError);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });

    it('should handle error call without error object', () => {
      const testMessage = 'test error message';

      service.error(testMessage);

      expect(mockLogger.error).toHaveBeenCalledWith(testMessage, undefined);
    });

    it('should handle empty message with error object', () => {
      const testError = new Error('test error');

      service.error('', testError);

      expect(mockLogger.error).toHaveBeenCalledWith('', testError);
    });

    it('should handle multiple calls with different errors', () => {
      const error1 = new Error('error 1');
      const error2 = new Error('error 2');

      service.error('message 1', error1);
      service.error('message 2', error2);

      expect(mockLogger.error).toHaveBeenCalledTimes(2);
      expect(mockLogger.error).toHaveBeenNthCalledWith(1, 'message 1', error1);
      expect(mockLogger.error).toHaveBeenNthCalledWith(2, 'message 2', error2);
    });
  });

  describe('Integration with console', () => {
    beforeEach(() => {
      service = new LoggerService();
    });

    it('should use console.info for info messages when using default logger', () => {
      const consoleSpy = jest.spyOn(console, 'info');
      const message = 'test console info';

      service.info(message);

      expect(consoleSpy).toHaveBeenCalledWith(message, undefined);
      consoleSpy.mockRestore();
    });

    it('should use console.error for error messages when using default logger', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      const message = 'test console error';
      const error = new Error('test error');

      service.error(message, error);

      expect(consoleSpy).toHaveBeenCalledWith(message, error);
      consoleSpy.mockRestore();
    });
  });
});
