import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IDatabaseService } from '../../database/services/i.database.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { School } from '../models/school.model';

export abstract class ISchoolsRepository {
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
  ): Promise<School>;
  public abstract getById(
    schoolId: string,
    organizationId: string,
  ): Promise<School>;
  public abstract getByOrganizationId(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<School>>;
  public abstract update(
    schoolId: string,
    name: string | undefined,
    userId: string,
  ): Promise<School>;
  public abstract delete(schoolId: string, userId: string): Promise<void>;
  public abstract deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void>;
  public abstract countActiveByOrganizationId(
    organizationId: string,
  ): Promise<number>;
}
