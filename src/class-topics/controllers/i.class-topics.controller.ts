import type { JwtPayload } from '../../auth/models/jwt.model';
import type { Membership } from '../../memberships/models/membership.model';
import { CreateClassTopicBodyDTO } from '../dtos/create-class-topic.dto';
import { DeleteClassTopicParamsDTO } from '../dtos/delete-class-topic.dto';
import { GetClassTopicsParamsDTO } from '../dtos/get-class-topics.dto';
import { ClassTopicDetail } from '../models/class-topic-detail.model';
import { ClassTopic } from '../models/class-topic.model';
import { IClassTopicsService } from '../services/i.class-topics.service';

export abstract class IClassTopicsController {
  protected readonly classTopicsService: IClassTopicsService;

  public constructor(classTopicsService: IClassTopicsService) {
    this.classTopicsService = classTopicsService;
  }

  public abstract create(
    classId: string,
    body: CreateClassTopicBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<ClassTopic>;
  public abstract delete(
    params: DeleteClassTopicParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
  public abstract getByClassId(
    params: GetClassTopicsParamsDTO,
    membership: Membership,
  ): Promise<ClassTopicDetail[]>;
}
