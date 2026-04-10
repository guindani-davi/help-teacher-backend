import type { JwtPayload } from '../../auth/models/jwt.model';
import { ClassDetail } from '../../classes/models/class-detail.model';
import { IClassesService } from '../../classes/services/i.classes.service';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import type { Membership } from '../../memberships/models/membership.model';
import { CreateStudentBodyDTO } from '../dtos/create-student.dto';
import { DeleteStudentParamsDTO } from '../dtos/delete-student.dto';
import { GetStudentParamsDTO } from '../dtos/get-student.dto';
import {
  UpdateStudentBodyDTO,
  UpdateStudentParamsDTO,
} from '../dtos/update-student.dto';
import { StudentDetail } from '../models/student-detail.model';
import { Student } from '../models/student.model';
import { IStudentsService } from '../services/i.students.service';

export abstract class IStudentsController {
  protected readonly studentsService: IStudentsService;
  protected readonly classesService: IClassesService;

  public constructor(
    studentsService: IStudentsService,
    classesService: IClassesService,
  ) {
    this.studentsService = studentsService;
    this.classesService = classesService;
  }

  public abstract create(
    body: CreateStudentBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Student>;
  public abstract getById(
    params: GetStudentParamsDTO,
    membership: Membership,
  ): Promise<Student>;
  public abstract getDetails(
    params: GetStudentParamsDTO,
    membership: Membership,
  ): Promise<StudentDetail>;
  public abstract getStudentClasses(
    params: GetStudentParamsDTO,
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<ClassDetail>>;
  public abstract getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Student>>;
  public abstract update(
    params: UpdateStudentParamsDTO,
    body: UpdateStudentBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Student>;
  public abstract delete(
    params: DeleteStudentParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
}
