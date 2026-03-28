import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { LocaleEnum } from '../../i18n/enums/locale.enum';
import { II18nService } from '../../i18n/services/i.i18n.service';
import { DomainExceptionCode } from '../enums/domain-exception-code.enum';
import { DomainException } from '../exceptions/domain.exception';
import { ApiErrorResponse } from '../models/api-error.model';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger: Logger;
  private readonly i18nService: II18nService;

  public constructor(@Inject(II18nService) i18nService: II18nService) {
    this.logger = new Logger(AllExceptionsFilter.name);
    this.i18nService = i18nService;
  }

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
    [DomainExceptionCode.INSUFFICIENT_SUBSCRIPTION, HttpStatus.FORBIDDEN],
    [DomainExceptionCode.SUBSCRIPTION_REQUIRED, HttpStatus.FORBIDDEN],
    [DomainExceptionCode.SUBSCRIPTION_ALREADY_CANCELING, HttpStatus.CONFLICT],
    [DomainExceptionCode.SUBSCRIPTION_NOT_CANCELING, HttpStatus.CONFLICT],
    [DomainExceptionCode.SUBSCRIPTION_CANCEL_NOT_ALLOWED, HttpStatus.CONFLICT],
    [DomainExceptionCode.SUBSCRIPTION_INVALID_STATE, HttpStatus.CONFLICT],
    [DomainExceptionCode.ASAAS_API_ERROR, HttpStatus.BAD_GATEWAY],
    [DomainExceptionCode.REGISTRATION_OVERLAP, HttpStatus.CONFLICT],
  ]);

  public catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const locale = this.resolveLocale(request);

    const { statusCode, errorResponse } = this.buildErrorResponse(
      exception,
      locale,
    );

    this.logException(statusCode, request, exception);

    response.status(statusCode).json(errorResponse);
  }

  private logException(
    statusCode: number,
    request: Request,
    exception: unknown,
  ): void {
    const message =
      exception instanceof Error ? exception.message : 'Unknown error';
    const logMessage = `${statusCode} - ${message} | ${request.method} ${request.url}`;

    if (statusCode >= 500) {
      this.logger.error(logMessage);

      if (exception instanceof Error) {
        this.logger.error(exception.stack);
      }
    } else {
      this.logger.warn(logMessage);
    }
  }

  private buildErrorResponse(
    exception: unknown,
    locale: LocaleEnum,
  ): {
    statusCode: number;
    errorResponse: ApiErrorResponse;
  } {
    if (exception instanceof DomainException) {
      return this.handleDomainException(exception, locale);
    }

    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, locale);
    }

    return this.handleUnknownException(locale);
  }

  private handleDomainException(
    exception: DomainException,
    locale: LocaleEnum,
  ): {
    statusCode: number;
    errorResponse: ApiErrorResponse;
  } {
    const statusCode =
      AllExceptionsFilter.DOMAIN_CODE_TO_STATUS.get(exception.code) ??
      HttpStatus.INTERNAL_SERVER_ERROR;

    const translatedArgs = this.translateEntityArgs(
      exception.messageArgs,
      locale,
    );

    const translatedMessage = this.i18nService.t(
      locale,
      exception.messageKey,
      translatedArgs,
    );

    return {
      statusCode,
      errorResponse: ApiErrorResponse.create(
        exception.code,
        translatedMessage,
        exception.details,
      ),
    };
  }

  private handleHttpException(
    exception: HttpException,
    locale: LocaleEnum,
  ): {
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
          this.i18nService.t(locale, 'errors.validationError'),
          details,
        ),
      };
    }

    if (
      typeof exceptionResponse === 'object' &&
      'messageKey' in exceptionResponse
    ) {
      const { messageKey } = exceptionResponse as { messageKey: string };
      const translatedMessage = this.i18nService.t(locale, messageKey);
      const errorCode = this.statusToErrorCode(statusCode);

      return {
        statusCode,
        errorResponse: ApiErrorResponse.create(errorCode, translatedMessage),
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

  private handleUnknownException(locale: LocaleEnum): {
    statusCode: number;
    errorResponse: ApiErrorResponse;
  } {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorResponse: ApiErrorResponse.create(
        'INTERNAL_SERVER_ERROR',
        this.i18nService.t(locale, 'errors.internalServerError'),
      ),
    };
  }

  private resolveLocale(request: Request): LocaleEnum {
    const user = (request as unknown as Record<string, unknown>).user as
      | { locale?: string }
      | undefined;

    if (
      user?.locale &&
      Object.values(LocaleEnum).includes(user.locale as LocaleEnum)
    ) {
      return user.locale as LocaleEnum;
    }

    const acceptLanguage = request.headers['accept-language'];

    if (acceptLanguage) {
      const requested = acceptLanguage.split(',')[0]?.trim();

      if (requested) {
        const match = Object.values(LocaleEnum).find(
          (l) => l === requested || requested.startsWith(l),
        );

        if (match) return match;
      }
    }

    return LocaleEnum.PT_BR;
  }

  private translateEntityArgs(
    args: Record<string, string> | undefined,
    locale: LocaleEnum,
  ): Record<string, string> | undefined {
    if (!args?.entity) return args;

    const entityKey = this.entityNameToKey(args.entity);
    const translatedEntity = this.i18nService.t(
      locale,
      `entities.${entityKey}`,
    );

    return { ...args, entity: translatedEntity };
  }

  private entityNameToKey(name: string): string {
    return name
      .replace(/-/g, ' ')
      .split(' ')
      .filter((word) => word.toLowerCase() !== 'link')
      .map((word, i) =>
        i === 0
          ? word.toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      )
      .join('');
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
