import { Inject, Injectable } from '@nestjs/common';
import { RolesEnum } from '../../../auth/enums/roles.enum';
import { JwtPayload } from '../../../auth/payloads/jwt.payload';
import { EntityAlreadyExistsException } from '../../../common/exceptions/entity-already-exists.exception';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { PostgresErrorCode } from '../../../database/enums/postgres-error-code.enum';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/service/i.database.service';
import { Database } from '../../../database/types';
import { IHelpersService } from '../../../helpers/service/i.helpers.service';
import { CreateOrganizationBodyDTO } from '../../dtos/create-organization.dto';
import { DeleteMemberParamsDTO } from '../../dtos/delete-member.dto';
import { DeleteOrganizationParamsDTO } from '../../dtos/delete-organization.dto';
import { GetOrganizationBySlugParamsDTO } from '../../dtos/get-organization.dto';
import { TransferOwnershipParamsDTO } from '../../dtos/transfer-ownership.dto';
import {
  UpdateMemberBodyDTO,
  UpdateMemberParamsDTO,
} from '../../dtos/update-member.dto';
import {
  UpdateOrganizationBySlugBodyDTO,
  UpdateOrganizationBySlugParamsDTO,
} from '../../dtos/update-organization.dto';

import { Membership } from '../../model/membership.model';
import { Organization } from '../../model/organization.model';
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
        created_by: user.id,
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
        user_id: user.id,
        organization_id: createdOrg.data.id,
        roles: [RolesEnum.OWNER],
        created_by: user.id,
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
        updated_by: user.id,
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

  public async getMembership(
    organizationId: string,
    user: JwtPayload,
  ): Promise<Membership> {
    const result = await this.databaseService
      .from('memberships')
      .select()
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Membership');
    }

    return this.mapToMembershipEntity(result.data);
  }

  public async getMembers(organizationId: string): Promise<Membership[]> {
    const result = await this.databaseService
      .from('memberships')
      .select()
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (result.error) {
      throw new DatabaseException();
    }

    return result.data.map((row) => this.mapToMembershipEntity(row));
  }

  public async updateMember(
    params: UpdateMemberParamsDTO,
    body: UpdateMemberBodyDTO,
    user: JwtPayload,
  ): Promise<Membership> {
    const updatedMemberData: Database['public']['Tables']['memberships']['Update'] =
      {
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        roles: body.roles,
        is_active: body.isActive,
      };

    const updatedMember = await this.databaseService
      .from('memberships')
      .update(updatedMemberData)
      .eq('id', params.memberId)
      .eq('is_active', true)
      .select()
      .single();

    if (!updatedMember.data) {
      throw new EntityNotFoundException('Membership');
    }

    return this.mapToMembershipEntity(updatedMember.data);
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
        updated_by: user.id,
        updated_at: now,
      })
      .eq('id', organization.id)
      .eq('is_active', true);

    if (orgResult.error) {
      throw new DatabaseException();
    }

    const membershipsResult = await this.databaseService
      .from('memberships')
      .update({
        is_active: false,
        updated_by: user.id,
        updated_at: now,
      })
      .eq('organization_id', organization.id)
      .eq('is_active', true);

    if (membershipsResult.error) {
      throw new DatabaseException();
    }
  }

  public async deleteMember(
    params: DeleteMemberParamsDTO,
    user: JwtPayload,
  ): Promise<void> {
    const result = await this.databaseService
      .from('memberships')
      .update({
        is_active: false,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.memberId)
      .eq('is_active', true);

    if (result.error) {
      throw new DatabaseException();
    }

    if (result.count === 0) {
      throw new EntityNotFoundException('Membership');
    }
  }

  public async getMembershipById(membershipId: string): Promise<Membership> {
    const result = await this.databaseService
      .from('memberships')
      .select()
      .eq('id', membershipId)
      .eq('is_active', true)
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Membership');
    }

    return this.mapToMembershipEntity(result.data);
  }

  public async transferOwnership(
    params: TransferOwnershipParamsDTO,
    callerMembership: Membership,
    user: JwtPayload,
  ): Promise<Membership> {
    const now = new Date().toISOString();

    const demoteResult = await this.databaseService
      .from('memberships')
      .update({
        roles: [RolesEnum.ADMIN],
        updated_by: user.id,
        updated_at: now,
      })
      .eq('id', callerMembership.id)
      .eq('is_active', true);

    if (demoteResult.error) {
      throw new DatabaseException();
    }

    const promoteResult = await this.databaseService
      .from('memberships')
      .update({
        roles: [RolesEnum.OWNER],
        updated_by: user.id,
        updated_at: now,
      })
      .eq('id', params.memberId)
      .eq('is_active', true)
      .select()
      .single();

    if (!promoteResult.data) {
      throw new EntityNotFoundException('Membership');
    }

    return this.mapToMembershipEntity(promoteResult.data);
  }

  protected mapToEntity(
    data: Database['public']['Tables']['organizations']['Row'],
  ): Organization {
    const { createdAtDate, updatedAtDate } =
      this.helperService.parseEntitiesDates(data.created_at, data.updated_at);

    return new Organization(
      data.id,
      data.name,
      data.slug,
      data.is_active,
      data.created_by,
      data.updated_by,
      createdAtDate,
      updatedAtDate,
    );
  }

  protected mapToMembershipEntity(
    data: Database['public']['Tables']['memberships']['Row'],
  ): Membership {
    const { createdAtDate, updatedAtDate } =
      this.helperService.parseEntitiesDates(data.created_at, data.updated_at);

    return new Membership(
      data.id,
      data.user_id,
      data.organization_id,
      data.roles as RolesEnum[],
      data.is_active,
      data.created_by,
      data.updated_by,
      createdAtDate,
      updatedAtDate,
    );
  }
}
