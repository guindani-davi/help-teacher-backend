import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class CannotDowngradeException extends DomainException {
  public constructor() {
    super(
      'Cannot downgrade subscription due to current usage constraints',
      DomainExceptionCode.CANNOT_DOWNGRADE,
    );
  }
}
