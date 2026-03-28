import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import type { Membership } from '../../memberships/models/membership.model';
import { CreateSubjectBodyDTO } from '../dtos/create-subject.dto';
import { DeleteSubjectParamsDTO } from '../dtos/delete-subject.dto';
import { GetSubjectParamsDTO } from '../dtos/get-subject.dto';
import {
  UpdateSubjectBodyDTO,
  UpdateSubjectParamsDTO,
} from '../dtos/update-subject.dto';
import { Subject } from '../models/subject.model';
import { ISubjectsService } from '../services/i.subjects.service';

export abstract class ISubjectsController {
  protected readonly subjectsService: ISubjectsService;

  public constructor(subjectsService: ISubjectsService) {
    this.subjectsService = subjectsService;
  }

  public abstract create(
    body: CreateSubjectBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Subject>;
  public abstract getById(
    params: GetSubjectParamsDTO,
    membership: Membership,
  ): Promise<Subject>;
  public abstract getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Subject>>;
  public abstract update(
    params: UpdateSubjectParamsDTO,
    body: UpdateSubjectBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Subject>;
  public abstract delete(
    params: DeleteSubjectParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
}
