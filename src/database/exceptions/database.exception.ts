import { DomainExceptionCode } from '../../common/enums/domain-exception-code.enum';
import { DomainException } from '../../common/exceptions/domain.exception';

export class DatabaseException extends DomainException {
  public constructor() {
    super(
      'An unexpected database error occurred',
      DomainExceptionCode.DATABASE_ERROR,
      'errors.databaseError',
    );
  }
}
