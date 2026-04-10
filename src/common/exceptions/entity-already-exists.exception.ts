import { DomainExceptionCode } from '../enums/domain-exception-code.enum';
import { DomainException } from './domain.exception';

export class EntityAlreadyExistsException extends DomainException {
  public constructor(entity: string) {
    super(
      `${entity} already exists`,
      DomainExceptionCode.ENTITY_ALREADY_EXISTS,
      'errors.entityAlreadyExists',
      { entity },
    );
  }
}
