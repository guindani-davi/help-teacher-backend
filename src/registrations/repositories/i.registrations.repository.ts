import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IDatabaseService } from '../../database/services/i.database.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { Registration } from '../models/registration.model';

export abstract class IRegistrationsRepository {
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
    studentId: string,
    schoolId: string,
    gradeLevelId: string,
    organizationId: string,
    startDate: string,
    endDate: string | undefined,
    userId: string,
  ): Promise<Registration>;
  public abstract getById(
    registrationId: string,
    organizationId: string,
  ): Promise<Registration>;
  public abstract getByOrganizationId(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Registration>>;
  public abstract update(
    registrationId: string,
    studentId: string | undefined,
    schoolId: string | undefined,
    gradeLevelId: string | undefined,
    startDate: string | undefined,
    endDate: string | null | undefined,
    userId: string,
  ): Promise<Registration>;
  public abstract delete(registrationId: string, userId: string): Promise<void>;
  public abstract deactivateByStudentId(
    studentId: string,
    userId: string,
  ): Promise<void>;
  public abstract deactivateBySchoolId(
    schoolId: string,
    userId: string,
  ): Promise<void>;
  public abstract deactivateByGradeLevelId(
    gradeLevelId: string,
    userId: string,
  ): Promise<void>;
  public abstract deactivateByGradeLevelIds(
    gradeLevelIds: string[],
    userId: string,
  ): Promise<void>;
  public abstract deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void>;
  public abstract countActiveByOrganizationId(
    organizationId: string,
  ): Promise<number>;
  public abstract hasOverlapping(
    studentId: string,
    organizationId: string,
    startDate: string,
    endDate: string | null | undefined,
    excludeRegistrationId?: string,
  ): Promise<boolean>;
  public abstract closeCurrentRegistration(
    studentId: string,
    organizationId: string,
    endDate: string,
    userId: string,
  ): Promise<void>;
}
