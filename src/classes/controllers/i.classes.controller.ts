import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import type { Membership } from '../../memberships/models/membership.model';
import { CreateClassBodyDTO } from '../dtos/create-class.dto';
import { DeleteClassParamsDTO } from '../dtos/delete-class.dto';
import { GetClassParamsDTO } from '../dtos/get-class.dto';
import {
  UpdateClassBodyDTO,
  UpdateClassParamsDTO,
} from '../dtos/update-class.dto';
import { ClassDetail } from '../models/class-detail.model';
import { Class } from '../models/class.model';
import { IClassesService } from '../services/i.classes.service';

export abstract class IClassesController {
  protected readonly classesService: IClassesService;

  public constructor(classesService: IClassesService) {
    this.classesService = classesService;
  }

  public abstract create(
    body: CreateClassBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Class>;
  public abstract getById(
    params: GetClassParamsDTO,
    membership: Membership,
  ): Promise<Class>;
  public abstract getDetails(
    params: GetClassParamsDTO,
    membership: Membership,
  ): Promise<ClassDetail>;
  public abstract getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Class>>;
  public abstract update(
    params: UpdateClassParamsDTO,
    body: UpdateClassBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Class>;
  public abstract delete(
    params: DeleteClassParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
}
