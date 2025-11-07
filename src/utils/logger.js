// src/utils/logger.js
import { db } from '../firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

class Logger {
  constructor() {
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
    };
    this.currentLevel =
      process.env.NODE_ENV === 'production'
        ? this.levels.INFO
        : this.levels.DEBUG;
  }

  // Formatear timestamp
  getTimestamp() {
    return new Date().toISOString();
  }

  // Formatear mensaje de log
  formatMessage(level, message, meta = {}) {
    const logEntry = {
      timestamp: this.getTimestamp(),
      level,
      message,
      ...meta,
    };
    return logEntry;
  }

  // Log de error
  error(message, meta = {}) {
    if (this.currentLevel >= this.levels.ERROR) {
      const logEntry = this.formatMessage('ERROR', message, meta);
      console.error(`[${logEntry.timestamp}] ERROR: ${message}`, meta);
      this.persistLog(logEntry);
    }
  }

  // Log de advertencia
  warn(message, meta = {}) {
    if (this.currentLevel >= this.levels.WARN) {
      const logEntry = this.formatMessage('WARN', message, meta);
      console.warn(`[${logEntry.timestamp}] WARN: ${message}`, meta);
      this.persistLog(logEntry);
    }
  }

  // Log informativo
  info(message, meta = {}) {
    if (this.currentLevel >= this.levels.INFO) {
      const logEntry = this.formatMessage('INFO', message, meta);
      console.info(`[${logEntry.timestamp}] INFO: ${message}`, meta);
      this.persistLog(logEntry);
    }
  }

  // Log de debug
  debug(message, meta = {}) {
    if (this.currentLevel >= this.levels.DEBUG) {
      const logEntry = this.formatMessage('DEBUG', message, meta);
      console.debug(`[${logEntry.timestamp}] DEBUG: ${message}`, meta);
      this.persistLog(logEntry);
    }
  }

  // Persistir logs (puede ser a archivo, base de datos, etc.)
  async persistLog(logEntry) {
    try {
      // Always persist transaction-related logs to Firestore
      if (logEntry.type && (logEntry.type.includes('payment') || logEntry.type.includes('transaction'))) {
        await addDoc(collection(db, 'transactionLogs'), {
          ...logEntry,
          timestamp: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error persisting log:', error);
    }
  }

  // Crear logger específico para operaciones de base de datos
  createDatabaseLogger(operation) {
    return {
      start: (details = {}) => {
        this.info(`Starting ${operation}`, {
          operation,
          type: 'database_operation_start',
          ...details,
        });
      },

      success: (details = {}) => {
        this.info(`${operation} completed successfully`, {
          operation,
          type: 'database_operation_success',
          ...details,
        });
      },

      error: (error, details = {}) => {
        this.error(`${operation} failed`, {
          operation,
          type: 'database_operation_error',
          error: error.message,
          stack: error.stack,
          ...details,
        });
      },

      batchProgress: (current, total, details = {}) => {
        this.debug(`Batch progress: ${current}/${total}`, {
          operation,
          type: 'batch_progress',
          current,
          total,
          ...details,
        });
      },
    };
  }

  // Crear logger específico para validaciones
  createValidationLogger() {
    return {
      invalidData: (field, value, reason, details = {}) => {
        this.warn(`Invalid data in field '${field}': ${reason}`, {
          type: 'validation_error',
          field,
          value: typeof value === 'object' ? JSON.stringify(value) : value,
          reason,
          ...details,
        });
      },

      validationSummary: (valid, invalid, details = {}) => {
        this.info(`Validation completed: ${valid} valid, ${invalid} invalid`, {
          type: 'validation_summary',
          valid,
          invalid,
          ...details,
        });
      },
    };
  }
}

// Exportar instancia singleton
export const logger = new Logger();
export default logger;
