import { Inject, Injectable } from '@nestjs/common';
import { RolesEnum } from '../../../auth/enums/roles.enum';
import { JwtPayload } from '../../../auth/models/jwt.model';
import { EntityAlreadyExistsException } from '../../../common/exceptions/entity-already-exists.exception';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { PostgresErrorCode } from '../../../database/enums/postgres-error-code.enum';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { Database } from '../../../database/types';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import { CreateOrganizationBodyDTO } from '../../dtos/create-organization.dto';
import { DeleteOrganizationParamsDTO } from '../../dtos/delete-organization.dto';
import { GetOrganizationBySlugParamsDTO } from '../../dtos/get-organization.dto';
import {
  UpdateOrganizationBySlugBodyDTO,
  UpdateOrganizationBySlugParamsDTO,
} from '../../dtos/update-organization.dto';
import { Organization } from '../../models/organization.model';
import { IOrganizationsRepository } from '../i.organizations.repository';

@Injectable()
export class OrganizationsRepository extends IOrganizationsRepository {
  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
    @Inject(IHelpersService) helperService: IHelpersService,
  ) {
    super(databaseService, helperService);
  }

  public async createOrganization(
    body: CreateOrganizationBodyDTO,
    slug: string,
    user: JwtPayload,
  ): Promise<Organization> {
    const createdOrgData: Database['public']['Tables']['organizations']['Insert'] =
      {
        name: body.name,
        slug: slug,
        created_by: user.sub,
      };

    const createdOrg = await this.databaseService
      .from('organizations')
      .insert(createdOrgData)
      .select()
      .single();

    if (createdOrg.error) {
      if (createdOrg.error.code === PostgresErrorCode.UNIQUE_VIOLATION) {
        throw new EntityAlreadyExistsException('Organization');
      }

      throw new DatabaseException();
    }

    const ownerMembership = await this.databaseService
      .from('memberships')
      .insert({
        user_id: user.sub,
        organization_id: createdOrg.data.id,
        roles: [RolesEnum.OWNER],
        created_by: user.sub,
      });

    if (ownerMembership.error) {
      throw new DatabaseException();
    }

    return this.mapToEntity(createdOrg.data);
  }

  public async getOrganizationBySlug(
    params: GetOrganizationBySlugParamsDTO,
  ): Promise<Organization> {
    const returnedOrg = await this.databaseService
      .from('organizations')
      .select()
      .eq('slug', params.slug)
      .eq('is_active', true)
      .single();

    if (!returnedOrg.data) {
      throw new EntityNotFoundException('Organization');
    }

    return this.mapToEntity(returnedOrg.data);
  }

  public async updateOrganization(
    params: UpdateOrganizationBySlugParamsDTO,
    body: UpdateOrganizationBySlugBodyDTO,
    newSlug: string | null,
    user: JwtPayload,
  ): Promise<Organization> {
    const updatedOrgData: Database['public']['Tables']['organizations']['Update'] =
      {
        updated_by: user.sub,
        updated_at: new Date().toISOString(),
        name: body.name,
        slug: newSlug ?? undefined,
      };

    const updatedOrg = await this.databaseService
      .from('organizations')
      .update(updatedOrgData)
      .eq('slug', params.slug)
      .eq('is_active', true)
      .select()
      .single();

    if (updatedOrg.error) {
      if (updatedOrg.error.code === PostgresErrorCode.UNIQUE_VIOLATION) {
        throw new EntityAlreadyExistsException('Organization');
      }

      if (updatedOrg.error.code === PostgresErrorCode.NO_ROWS_FOUND) {
        throw new EntityNotFoundException('Organization');
      }

      throw new DatabaseException();
    }

    if (!updatedOrg.data) {
      throw new EntityNotFoundException('Organization');
    }

    return this.mapToEntity(updatedOrg.data);
  }

  public async slugExists(slug: string): Promise<boolean> {
    const result = await this.databaseService
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    return !!result.data;
  }

  public async updateLogo(
    organizationId: string,
    logoUrl: string,
    userId: string,
  ): Promise<Organization> {
    const result = await this.databaseService
      .from('organizations')
      .update({
        logo_url: logoUrl,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)
      .eq('is_active', true)
      .select()
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Organization');
    }

    return this.mapToEntity(result.data);
  }

  public async deleteOrganization(
    params: DeleteOrganizationParamsDTO,
    user: JwtPayload,
  ): Promise<void> {
    const organization = await this.getOrganizationBySlug(params);

    const now = new Date().toISOString();

    const orgResult = await this.databaseService
      .from('organizations')
      .update({
        is_active: false,
        updated_by: user.sub,
        updated_at: now,
      })
      .eq('id', organization.id)
      .eq('is_active', true);

    if (orgResult.error) {
      throw new DatabaseException();
    }

    const deactivateData = {
      is_active: false,
      updated_by: user.sub,
      updated_at: now,
    };

    const orgId = organization.id;

    // Deactivate class_topics via topic_ids scoped to this org
    const topicIds = await this.databaseService
      .from('topics')
      .select('id')
      .eq('organization_id', orgId);

    const tIds = topicIds.data?.map((row) => row.id) ?? [];
    if (tIds.length > 0) {
      await this.databaseService
        .from('class_topics')
        .update(deactivateData)
        .in('topic_id', tIds)
        .eq('is_active', true);
    }

    // Deactivate student_users via student_ids scoped to this org
    const studentIds = await this.databaseService
      .from('students')
      .select('id')
      .eq('organization_id', orgId);

    const sIds = studentIds.data?.map((row) => row.id) ?? [];
    if (sIds.length > 0) {
      await this.databaseService
        .from('student_users')
        .update(deactivateData)
        .in('student_id', sIds)
        .eq('is_active', true);
    }

    // Deactivate all org-scoped tables in parallel
    await Promise.all([
      this.databaseService
        .from('memberships')
        .update(deactivateData)
        .eq('organization_id', orgId)
        .eq('is_active', true),
      this.databaseService
        .from('topics')
        .update(deactivateData)
        .eq('organization_id', orgId)
        .eq('is_active', true),
      this.databaseService
        .from('classes')
        .update(deactivateData)
        .eq('organization_id', orgId)
        .eq('is_active', true),
      this.databaseService
        .from('registrations')
        .update(deactivateData)
        .eq('organization_id', orgId)
        .eq('is_active', true),
      this.databaseService
        .from('schedules')
        .update(deactivateData)
        .eq('organization_id', orgId)
        .eq('is_active', true),
      this.databaseService
        .from('students')
        .update(deactivateData)
        .eq('organization_id', orgId)
        .eq('is_active', true),
      this.databaseService
        .from('schools')
        .update(deactivateData)
        .eq('organization_id', orgId)
        .eq('is_active', true),
      this.databaseService
        .from('subjects')
        .update(deactivateData)
        .eq('organization_id', orgId)
        .eq('is_active', true),
      this.databaseService
        .from('grade_levels')
        .update(deactivateData)
        .eq('organization_id', orgId)
        .eq('is_active', true),
      this.databaseService
        .from('education_levels')
        .update(deactivateData)
        .eq('organization_id', orgId)
        .eq('is_active', true),
      this.databaseService
        .from('invites')
        .update({ status: 'revoked' })
        .eq('organization_id', orgId)
        .eq('status', 'pending'),
    ]);
  }

  private mapToEntity(
    data: Database['public']['Tables']['organizations']['Row'],
  ): Organization {
    const { createdAtDate, updatedAtDate } =
      this.helperService.parseEntitiesDates(data.created_at, data.updated_at);

    return new Organization(
      data.id,
      data.name,
      data.slug,
      data.logo_url,
      data.is_active,
      data.created_by,
      data.updated_by,
      createdAtDate,
      updatedAtDate,
    );
  }
}
