// src/test/logger.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../utils/logger.js';

// Mock console methods
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic logging functionality', () => {
    it('should log info messages', () => {
      logger.info('Test info message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]: Test info message')
      );
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]: Test warning message')
      );
    });

    it('should log error messages', () => {
      logger.error('Test error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]: Test error message')
      );
    });

    it('should include metadata in logs', () => {
      const meta = { userId: '123', operation: 'test' };
      logger.info('Test with metadata', meta);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]: Test with metadata'),
        meta
      );
    });
  });

  describe('Database logger', () => {
    it('should create database logger with operation context', () => {
      const dbLogger = logger.createDatabaseLogger('test_operation');

      expect(typeof dbLogger.start).toBe('function');
      expect(typeof dbLogger.success).toBe('function');
      expect(typeof dbLogger.error).toBe('function');
    });

    it('should log database operation start', () => {
      const dbLogger = logger.createDatabaseLogger('test_operation');
      const details = { recordCount: 10 };

      dbLogger.start(details);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]: Starting test_operation'),
        expect.objectContaining(details)
      );
    });

    it('should log database operation success', () => {
      const dbLogger = logger.createDatabaseLogger('test_operation');
      const details = { recordsProcessed: 10 };

      dbLogger.success(details);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '[INFO]: test_operation completed successfully'
        ),
        expect.objectContaining(details)
      );
    });

    it('should log database operation error', () => {
      const dbLogger = logger.createDatabaseLogger('test_operation');
      const error = new Error('Test error');
      const details = { recordId: '123' };

      dbLogger.error(error, details);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]: test_operation failed'),
        expect.objectContaining({
          error: 'Test error',
          ...details,
        })
      );
    });
  });

  describe('Validation logger', () => {
    it('should create validation logger', () => {
      const validationLogger = logger.createValidationLogger();

      expect(typeof validationLogger.invalidData).toBe('function');
      expect(typeof validationLogger.validationSummary).toBe('function');
    });

    it('should log invalid data', () => {
      const validationLogger = logger.createValidationLogger();

      validationLogger.invalidData(
        'email',
        'invalid-email',
        'Formato inválido',
        {
          field: 'userEmail',
          attempt: 1,
        }
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[WARN]: Invalid data in field 'email'"),
        expect.objectContaining({
          field: 'email',
          value: 'invalid-email',
          reason: 'Formato inválido',
        })
      );
    });

    it('should log validation summary', () => {
      const validationLogger = logger.createValidationLogger();

      validationLogger.validationSummary(95, 5, { totalRecords: 100 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '[INFO]: Validation completed: 95 valid, 5 invalid'
        ),
        expect.objectContaining({ totalRecords: 100 })
      );
    });
  });

  describe('Log levels', () => {
    it('should respect log levels in development', () => {
      // En desarrollo debería mostrar todos los niveles
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1); // info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // warn
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error
      // Debug no debería aparecer en producción
    });
  });
});
