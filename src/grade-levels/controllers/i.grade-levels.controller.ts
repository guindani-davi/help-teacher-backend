import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import type { Membership } from '../../memberships/models/membership.model';
import { CreateGradeLevelBodyDTO } from '../dtos/create-grade-level.dto';
import { DeleteGradeLevelParamsDTO } from '../dtos/delete-grade-level.dto';
import { GetGradeLevelParamsDTO } from '../dtos/get-grade-level.dto';
import { GetGradeLevelsParamsDTO } from '../dtos/get-grade-levels.dto';
import {
  UpdateGradeLevelBodyDTO,
  UpdateGradeLevelParamsDTO,
} from '../dtos/update-grade-level.dto';
import { GradeLevel } from '../models/grade-level.model';
import { IGradeLevelsService } from '../services/i.grade-levels.service';

export abstract class IGradeLevelsController {
  protected readonly gradeLevelsService: IGradeLevelsService;

  public constructor(gradeLevelsService: IGradeLevelsService) {
    this.gradeLevelsService = gradeLevelsService;
  }

  public abstract create(
    body: CreateGradeLevelBodyDTO,
    educationLevelId: string,
    membership: Membership,
    user: JwtPayload,
  ): Promise<GradeLevel>;
  public abstract getById(
    params: GetGradeLevelParamsDTO,
    membership: Membership,
  ): Promise<GradeLevel>;
  public abstract getByEducationLevel(
    params: GetGradeLevelsParamsDTO,
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<GradeLevel>>;
  public abstract update(
    params: UpdateGradeLevelParamsDTO,
    body: UpdateGradeLevelBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<GradeLevel>;
  public abstract delete(
    params: DeleteGradeLevelParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
}
