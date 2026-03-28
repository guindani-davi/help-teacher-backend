import { Inject, Injectable } from '@nestjs/common';
import { EntityAlreadyExistsException } from '../../../common/exceptions/entity-already-exists.exception';
import { PostgresErrorCode } from '../../../database/enums/postgres-error-code.enum';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { Database } from '../../../database/types';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import { ClassTopicDetail } from '../../models/class-topic-detail.model';
import { ClassTopic } from '../../models/class-topic.model';
import { IClassTopicsRepository } from '../i.class-topics.repository';

@Injectable()
export class ClassTopicsRepository extends IClassTopicsRepository {
  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
    @Inject(IHelpersService) helperService: IHelpersService,
  ) {
    super(databaseService, helperService);
  }

  public async create(
    classId: string,
    topicId: string,
    createdBy: string,
  ): Promise<ClassTopic> {
    const data: Database['public']['Tables']['class_topics']['Insert'] = {
      class_id: classId,
      topic_id: topicId,
      created_by: createdBy,
    };

    const result = await this.databaseService
      .from('class_topics')
      .insert(data)
      .select()
      .single();

    if (result.error) {
      if (result.error.code === PostgresErrorCode.UNIQUE_VIOLATION) {
        throw new EntityAlreadyExistsException('Class-topic link');
      }
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  public async delete(
    classTopicId: string,
    classId: string,
    userId: string,
  ): Promise<void> {
    const result = await this.databaseService
      .from('class_topics')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', classTopicId)
      .eq('class_id', classId)
      .eq('is_active', true);

    if (result.error) {
      throw new DatabaseException();
    }
  }

  public async getByClassId(classId: string): Promise<ClassTopicDetail[]> {
    const result = await this.databaseService
      .from('class_topics')
      .select('id, topics(id, name, subject_id, subjects(id, name))')
      .eq('class_id', classId)
      .eq('is_active', true);

    if (result.error) {
      throw new DatabaseException();
    }

    const data = result.data as unknown as Array<{
      id: string;
      topics: {
        id: string;
        name: string;
        subject_id: string;
        subjects: { id: string; name: string };
      };
    }>;

    return data.map(
      (row) =>
        new ClassTopicDetail(
          row.id,
          row.topics.id,
          row.topics.name,
          row.topics.subjects.id,
          row.topics.subjects.name,
        ),
    );
  }

  public async deactivateByTopicId(
    topicId: string,
    userId: string,
  ): Promise<void> {
    await this.databaseService
      .from('class_topics')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('topic_id', topicId)
      .eq('is_active', true);
  }

  public async deactivateByClassId(
    classId: string,
    userId: string,
  ): Promise<void> {
    await this.databaseService
      .from('class_topics')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('class_id', classId)
      .eq('is_active', true);
  }

  public async deactivateByClassIds(
    classIds: string[],
    userId: string,
  ): Promise<void> {
    if (classIds.length === 0) return;

    await this.databaseService
      .from('class_topics')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .in('class_id', classIds)
      .eq('is_active', true);
  }

  public async deactivateByTopicIds(
    topicIds: string[],
    userId: string,
  ): Promise<void> {
    if (topicIds.length === 0) return;

    await this.databaseService
      .from('class_topics')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .in('topic_id', topicIds)
      .eq('is_active', true);
  }

  public async deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    const topicIds = await this.databaseService
      .from('topics')
      .select('id')
      .eq('organization_id', organizationId);

    const ids = topicIds.data?.map((row) => row.id) ?? [];
    if (ids.length === 0) return;

    await this.databaseService
      .from('class_topics')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .in('topic_id', ids)
      .eq('is_active', true);
  }

  private mapToEntity(
    data: Database['public']['Tables']['class_topics']['Row'],
  ): ClassTopic {
    const { createdAtDate, updatedAtDate } =
      this.helperService.parseEntitiesDates(data.created_at, data.updated_at);

    return new ClassTopic(
      data.id,
      data.class_id,
      data.topic_id,
      data.is_active,
      data.created_by,
      data.updated_by,
      createdAtDate,
      updatedAtDate,
    );
  }
}
