import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class AsaasApiException extends DomainException {
  public constructor(internalDetails?: string) {
    super(
      'Payment processing failed. Please try again or contact support.',
      DomainExceptionCode.ASAAS_API_ERROR,
    );

    if (internalDetails) {
      this.stack = `${this.stack}\nASAAS Details: ${internalDetails}`;
    }
  }
}
