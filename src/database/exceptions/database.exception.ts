import { DomainException } from '../../common/exceptions/domain.exception';

export class DatabaseException extends DomainException {
  public constructor(message?: string) {
    super(message ?? 'An unexpected database error occurred', 'DATABASE_ERROR');
  }
}
