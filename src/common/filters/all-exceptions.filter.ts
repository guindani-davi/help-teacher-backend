import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DomainExceptionCode } from '../enums/domain-exception-code.enum';
import { DomainException } from '../exceptions/domain.exception';
import { ApiErrorResponse } from '../responses/api-error.response';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  private static readonly DOMAIN_CODE_TO_STATUS = new Map<
    DomainExceptionCode,
    HttpStatus
  >([
    [DomainExceptionCode.ENTITY_NOT_FOUND, HttpStatus.NOT_FOUND],
    [DomainExceptionCode.ENTITY_ALREADY_EXISTS, HttpStatus.CONFLICT],
    [DomainExceptionCode.SLUG_ALREADY_EXISTS, HttpStatus.CONFLICT],
    [DomainExceptionCode.DATABASE_ERROR, HttpStatus.INTERNAL_SERVER_ERROR],
    [DomainExceptionCode.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED],
    [DomainExceptionCode.INVALID_RESET_TOKEN, HttpStatus.UNAUTHORIZED],
    [DomainExceptionCode.INVALID_REFRESH_TOKEN, HttpStatus.UNAUTHORIZED],
    [DomainExceptionCode.FORBIDDEN_OPERATION, HttpStatus.FORBIDDEN],
    [DomainExceptionCode.INVITE_ALREADY_EXISTS, HttpStatus.CONFLICT],
    [DomainExceptionCode.INVITE_EXPIRED, HttpStatus.GONE],
  ]);

  public catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();

    const { statusCode, errorResponse } = this.buildErrorResponse(exception);

    this.logException(statusCode, errorResponse, request, exception);

    response.status(statusCode).json(errorResponse);
  }

  private logException(
    statusCode: number,
    errorResponse: ApiErrorResponse,
    request: Request,
    exception: unknown,
  ): void {
    const logMessage = `${statusCode} ${errorResponse.error} - ${errorResponse.message} | ${request.method} ${request.url}`;

    if (statusCode >= 500) {
      this.logger.error(logMessage);

      if (exception instanceof Error) {
        this.logger.error(exception.stack);
      }
    } else {
      this.logger.warn(logMessage);
    }
  }

  private buildErrorResponse(exception: unknown): {
    statusCode: number;
    errorResponse: ApiErrorResponse;
  } {
    if (exception instanceof DomainException) {
      return this.handleDomainException(exception);
    }

    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    return this.handleUnknownException();
  }

  private handleDomainException(exception: DomainException): {
    statusCode: number;
    errorResponse: ApiErrorResponse;
  } {
    const statusCode =
      AllExceptionsFilter.DOMAIN_CODE_TO_STATUS.get(exception.code) ??
      HttpStatus.INTERNAL_SERVER_ERROR;

    return {
      statusCode,
      errorResponse: ApiErrorResponse.create(exception.code, exception.message),
    };
  }

  private handleHttpException(exception: HttpException): {
    statusCode: number;
    errorResponse: ApiErrorResponse;
  } {
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (this.isValidationError(exceptionResponse)) {
      const details = (exceptionResponse as { message: string[] }).message;

      return {
        statusCode,
        errorResponse: ApiErrorResponse.create(
          'VALIDATION_ERROR',
          'One or more validation errors occurred',
          details,
        ),
      };
    }

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as { message?: string }).message ??
          'An unexpected error occurred');

    const errorCode = this.statusToErrorCode(statusCode);

    return {
      statusCode,
      errorResponse: ApiErrorResponse.create(errorCode, message),
    };
  }

  private handleUnknownException(): {
    statusCode: number;
    errorResponse: ApiErrorResponse;
  } {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorResponse: ApiErrorResponse.create(
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred',
      ),
    };
  }

  private isValidationError(response: string | object): boolean {
    return (
      typeof response === 'object' &&
      'message' in response &&
      Array.isArray((response as { message: unknown }).message)
    );
  }

  private statusToErrorCode(status: number): string {
    const statusTextMap = new Map<number, string>([
      [HttpStatus.BAD_REQUEST, 'BAD_REQUEST'],
      [HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED'],
      [HttpStatus.FORBIDDEN, 'FORBIDDEN'],
      [HttpStatus.NOT_FOUND, 'NOT_FOUND'],
      [HttpStatus.CONFLICT, 'CONFLICT'],
      [HttpStatus.UNPROCESSABLE_ENTITY, 'UNPROCESSABLE_ENTITY'],
      [HttpStatus.TOO_MANY_REQUESTS, 'TOO_MANY_REQUESTS'],
      [HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_SERVER_ERROR'],
    ]);

    return statusTextMap.get(status) ?? 'UNKNOWN_ERROR';
  }
}
