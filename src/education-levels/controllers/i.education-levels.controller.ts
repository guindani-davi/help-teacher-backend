import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import type { Membership } from '../../memberships/models/membership.model';
import { CreateEducationLevelBodyDTO } from '../dtos/create-education-level.dto';
import { DeleteEducationLevelParamsDTO } from '../dtos/delete-education-level.dto';
import { GetEducationLevelParamsDTO } from '../dtos/get-education-level.dto';
import {
  UpdateEducationLevelBodyDTO,
  UpdateEducationLevelParamsDTO,
} from '../dtos/update-education-level.dto';
import { EducationLevel } from '../models/education-level.model';
import { IEducationLevelsService } from '../services/i.education-levels.service';

export abstract class IEducationLevelsController {
  protected readonly educationLevelsService: IEducationLevelsService;

  public constructor(educationLevelsService: IEducationLevelsService) {
    this.educationLevelsService = educationLevelsService;
  }

  public abstract create(
    body: CreateEducationLevelBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<EducationLevel>;
  public abstract getById(
    params: GetEducationLevelParamsDTO,
    membership: Membership,
  ): Promise<EducationLevel>;
  public abstract getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<EducationLevel>>;
  public abstract update(
    params: UpdateEducationLevelParamsDTO,
    body: UpdateEducationLevelBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<EducationLevel>;
  public abstract delete(
    params: DeleteEducationLevelParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
}
