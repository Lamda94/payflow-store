import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  DomainError,
  InsufficientStockError,
  ProductNotFoundError,
  TransactionAlreadyProcessedError,
  TransactionNotFoundError,
} from '../../../domain/errors/domain.errors';

interface ErrorBody {
  code: string;
  message: string;
}

const HTTP_ERROR_CODES: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
};

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, body } = this.resolve(exception);

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json(body);
  }

  private resolve(exception: unknown): { status: HttpStatus; body: ErrorBody } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const message =
        typeof raw === 'string'
          ? raw
          : ((raw as { message?: string | string[] }).message ??
            exception.message);
      return {
        status,
        body: {
          code: HTTP_ERROR_CODES[status] ?? 'HTTP_ERROR',
          message: Array.isArray(message) ? message.join('; ') : message,
        },
      };
    }
    if (exception instanceof ProductNotFoundError) {
      return {
        status: HttpStatus.NOT_FOUND,
        body: { code: 'PRODUCT_NOT_FOUND', message: exception.message },
      };
    }
    if (exception instanceof TransactionNotFoundError) {
      return {
        status: HttpStatus.NOT_FOUND,
        body: { code: 'TRANSACTION_NOT_FOUND', message: exception.message },
      };
    }
    if (exception instanceof InsufficientStockError) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        body: { code: 'INSUFFICIENT_STOCK', message: exception.message },
      };
    }
    if (exception instanceof TransactionAlreadyProcessedError) {
      return {
        status: HttpStatus.CONFLICT,
        body: {
          code: 'TRANSACTION_ALREADY_PROCESSED',
          message: exception.message,
        },
      };
    }
    if (exception instanceof DomainError) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        body: { code: 'DOMAIN_ERROR', message: exception.message },
      };
    }

    const isGatewayError =
      exception instanceof Error &&
      (exception.message.includes('ECONNREFUSED') ||
        exception.message.includes('ENOTFOUND') ||
        exception.message.includes('timeout') ||
        exception.message.includes('502'));

    if (isGatewayError) {
      return {
        status: HttpStatus.BAD_GATEWAY,
        body: {
          code: 'PAYMENT_GATEWAY_ERROR',
          message: 'Payment gateway unavailable',
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    };
  }
}
