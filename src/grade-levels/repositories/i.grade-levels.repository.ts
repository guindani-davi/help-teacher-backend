import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IDatabaseService } from '../../database/services/i.database.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { GradeLevel } from '../models/grade-level.model';

export abstract class IGradeLevelsRepository {
  protected readonly databaseService: IDatabaseService;
  protected readonly helperService: IHelpersService;

  public constructor(
    databaseService: IDatabaseService,
    helperService: IHelpersService,
  ) {
    this.databaseService = databaseService;
    this.helperService = helperService;
  }

  public abstract create(
    name: string,
    educationLevelId: string,
    organizationId: string,
    userId: string,
  ): Promise<GradeLevel>;
  public abstract getById(
    gradeLevelId: string,
    organizationId: string,
  ): Promise<GradeLevel>;
  public abstract getByEducationLevelId(
    educationLevelId: string,
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<GradeLevel>>;
  public abstract update(
    gradeLevelId: string,
    name: string | undefined,
    userId: string,
  ): Promise<GradeLevel>;
  public abstract delete(gradeLevelId: string, userId: string): Promise<void>;
  public abstract deactivateByEducationLevelId(
    educationLevelId: string,
    userId: string,
  ): Promise<void>;
  public abstract deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void>;
  public abstract getActiveIdsByEducationLevelId(
    educationLevelId: string,
  ): Promise<string[]>;
  public abstract countActiveByOrganizationId(
    organizationId: string,
  ): Promise<number>;
}
