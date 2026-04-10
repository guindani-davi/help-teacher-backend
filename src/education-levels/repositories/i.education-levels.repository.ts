import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IDatabaseService } from '../../database/services/i.database.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { EducationLevel } from '../models/education-level.model';

export abstract class IEducationLevelsRepository {
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
    organizationId: string,
    userId: string,
  ): Promise<EducationLevel>;
  public abstract getById(
    educationLevelId: string,
    organizationId: string,
  ): Promise<EducationLevel>;
  public abstract getByOrganizationId(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<EducationLevel>>;
  public abstract update(
    educationLevelId: string,
    name: string | undefined,
    userId: string,
  ): Promise<EducationLevel>;
  public abstract delete(
    educationLevelId: string,
    userId: string,
  ): Promise<void>;
  public abstract deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void>;
  public abstract countActiveByOrganizationId(
    organizationId: string,
  ): Promise<number>;
}
