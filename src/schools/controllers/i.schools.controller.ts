import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import type { Membership } from '../../memberships/models/membership.model';
import { CreateSchoolBodyDTO } from '../dtos/create-school.dto';
import { DeleteSchoolParamsDTO } from '../dtos/delete-school.dto';
import { GetSchoolParamsDTO } from '../dtos/get-school.dto';
import {
  UpdateSchoolBodyDTO,
  UpdateSchoolParamsDTO,
} from '../dtos/update-school.dto';
import { School } from '../models/school.model';
import { ISchoolsService } from '../services/i.schools.service';

export abstract class ISchoolsController {
  protected readonly schoolsService: ISchoolsService;

  public constructor(schoolsService: ISchoolsService) {
    this.schoolsService = schoolsService;
  }

  public abstract create(
    body: CreateSchoolBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<School>;
  public abstract getById(
    params: GetSchoolParamsDTO,
    membership: Membership,
  ): Promise<School>;
  public abstract getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<School>>;
  public abstract update(
    params: UpdateSchoolParamsDTO,
    body: UpdateSchoolBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<School>;
  public abstract delete(
    params: DeleteSchoolParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
}
