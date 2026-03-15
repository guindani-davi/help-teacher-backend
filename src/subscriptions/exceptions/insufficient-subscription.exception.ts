import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class InsufficientSubscriptionException extends DomainException {
  public constructor(requiredTier: string) {
    super(
      `This action requires at least a ${requiredTier} subscription`,
      DomainExceptionCode.INSUFFICIENT_SUBSCRIPTION,
    );
  }
}
