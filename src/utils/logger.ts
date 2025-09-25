// Logger estruturado para produção
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMessage {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, data?: any, context?: string): LogMessage {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context
    };
  }

  private log(logMessage: LogMessage) {
    if (this.isDevelopment) {
      const { level, message, data, context } = logMessage;
      const prefix = context ? `[${context}]` : '';
      
      switch (level) {
        case 'error':
          console.error(`${prefix} ${message}`, data);
          break;
        case 'warn':
          console.warn(`${prefix} ${message}`, data);
          break;
        case 'info':
          console.info(`${prefix} ${message}`, data);
          break;
        case 'debug':
          console.log(`${prefix} ${message}`, data);
          break;
      }
    } else {
      // Em produção, poderia enviar para um serviço de logging
      // Por enquanto, apenas erros críticos são logados
      if (logMessage.level === 'error') {
        console.error(logMessage.message, logMessage.data);
      }
    }
  }

  info(message: string, data?: any, context?: string) {
    this.log(this.formatMessage('info', message, data, context));
  }

  warn(message: string, data?: any, context?: string) {
    this.log(this.formatMessage('warn', message, data, context));
  }

  error(message: string, data?: any, context?: string) {
    this.log(this.formatMessage('error', message, data, context));
  }

  debug(message: string, data?: any, context?: string) {
    this.log(this.formatMessage('debug', message, data, context));
  }
}

export const logger = new Logger();