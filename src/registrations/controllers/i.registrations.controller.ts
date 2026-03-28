import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import type { Membership } from '../../memberships/models/membership.model';
import { CreateRegistrationBodyDTO } from '../dtos/create-registration.dto';
import { DeleteRegistrationParamsDTO } from '../dtos/delete-registration.dto';
import { GetRegistrationParamsDTO } from '../dtos/get-registration.dto';
import {
  UpdateRegistrationBodyDTO,
  UpdateRegistrationParamsDTO,
} from '../dtos/update-registration.dto';
import { Registration } from '../models/registration.model';
import { IRegistrationsService } from '../services/i.registrations.service';

export abstract class IRegistrationsController {
  protected readonly registrationsService: IRegistrationsService;

  public constructor(registrationsService: IRegistrationsService) {
    this.registrationsService = registrationsService;
  }

  public abstract create(
    body: CreateRegistrationBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Registration>;
  public abstract getById(
    params: GetRegistrationParamsDTO,
    membership: Membership,
  ): Promise<Registration>;
  public abstract getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Registration>>;
  public abstract update(
    params: UpdateRegistrationParamsDTO,
    body: UpdateRegistrationBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Registration>;
  public abstract delete(
    params: DeleteRegistrationParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
}
