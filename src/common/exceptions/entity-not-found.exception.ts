import { DomainException } from './domain.exception';

export class EntityNotFoundException extends DomainException {
  public constructor(entity: string) {
    super(`${entity} was not found`, 'ENTITY_NOT_FOUND');
  }
}
