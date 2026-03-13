import { DomainException } from './domain.exception';

export class EntityAlreadyExistsException extends DomainException {
  public constructor(entity: string) {
    super(`${entity} already exists`, 'ENTITY_ALREADY_EXISTS');
  }
}
