import { Inject, Injectable } from '@nestjs/common';
import { RolesEnum } from '../../../auth/enums/roles.enum';
import { JwtPayload } from '../../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { Database } from '../../../database/types';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import { DeleteMemberParamsDTO } from '../../dtos/delete-member.dto';
import { TransferOwnershipParamsDTO } from '../../dtos/transfer-ownership.dto';
import {
  UpdateMemberBodyDTO,
  UpdateMemberParamsDTO,
} from '../../dtos/update-member.dto';
import { Membership } from '../../models/membership.model';
import { IMembershipsRepository } from '../i.memberships.repository';

@Injectable()
export class MembershipsRepository extends IMembershipsRepository {
  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
    @Inject(IHelpersService) helperService: IHelpersService,
  ) {
    super(databaseService, helperService);
  }

  public async getMembership(
    organizationId: string,
    user: JwtPayload,
  ): Promise<Membership> {
    const result = await this.databaseService
      .from('memberships')
      .select()
      .eq('organization_id', organizationId)
      .eq('user_id', user.sub)
      .eq('is_active', true)
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Membership');
    }

    return this.mapToEntity(result.data);
  }

  public async getMembershipBySlug(
    slug: string,
    userId: string,
  ): Promise<Membership> {
    const result = await this.databaseService
      .from('memberships')
      .select('*, organizations!inner(slug)')
      .eq('organizations.slug', slug)
      .eq('organizations.is_active', true)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Membership');
    }

    return this.mapToEntity(result.data);
  }

  public async getMembers(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Membership>> {
    const { from, to } = pagination.getRange();

    const result = await this.databaseService
      .from('memberships')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .range(from, to);

    if (result.error) {
      throw new DatabaseException();
    }

    const items = result.data.map((row) => this.mapToEntity(row));
    return new PaginatedResponse(
      items,
      result.count ?? 0,
      pagination.page,
      pagination.limit,
    );
  }

  public async updateMember(
    params: UpdateMemberParamsDTO,
    body: UpdateMemberBodyDTO,
    user: JwtPayload,
  ): Promise<Membership> {
    const updatedMemberData: Database['public']['Tables']['memberships']['Update'] =
      {
        updated_by: user.sub,
        updated_at: new Date().toISOString(),
        roles: body.roles,
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

    return this.mapToEntity(updatedMember.data);
  }

  public async deleteMember(
    params: DeleteMemberParamsDTO,
    user: JwtPayload,
  ): Promise<void> {
    const result = await this.databaseService
      .from('memberships')
      .update({
        is_active: false,
        updated_by: user.sub,
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

    return this.mapToEntity(result.data);
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
        updated_by: user.sub,
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
        updated_by: user.sub,
        updated_at: now,
      })
      .eq('id', params.memberId)
      .eq('is_active', true)
      .select()
      .single();

    if (!promoteResult.data) {
      throw new EntityNotFoundException('Membership');
    }

    return this.mapToEntity(promoteResult.data);
  }

  public async isUserMember(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    const result = await this.databaseService
      .from('memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    return !!result.data;
  }

  public async createMembership(
    userId: string,
    organizationId: string,
    roles: RolesEnum[],
    createdBy: string,
  ): Promise<void> {
    const result = await this.databaseService.from('memberships').insert({
      user_id: userId,
      organization_id: organizationId,
      roles,
      created_by: createdBy,
    });

    if (result.error) {
      throw new DatabaseException();
    }
  }

  public async addRoleToMember(
    userId: string,
    organizationId: string,
    role: RolesEnum,
    updatedBy: string,
  ): Promise<void> {
    const membership = await this.databaseService
      .from('memberships')
      .select('id, roles')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (!membership.data) {
      throw new EntityNotFoundException('Membership');
    }

    const currentRoles = membership.data.roles as RolesEnum[];
    if (currentRoles.includes(role)) {
      return;
    }

    const result = await this.databaseService
      .from('memberships')
      .update({
        roles: [...currentRoles, role],
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', membership.data.id)
      .eq('is_active', true);

    if (result.error) {
      throw new DatabaseException();
    }
  }

  public async removeRoleFromMember(
    userId: string,
    organizationId: string,
    role: RolesEnum,
    updatedBy: string,
  ): Promise<void> {
    const membership = await this.databaseService
      .from('memberships')
      .select('id, roles')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (!membership.data) {
      throw new EntityNotFoundException('Membership');
    }

    const currentRoles = membership.data.roles as RolesEnum[];
    const newRoles = currentRoles.filter((r) => r !== role);
    if (newRoles.length === currentRoles.length) {
      return;
    }

    const result = await this.databaseService
      .from('memberships')
      .update({
        roles: newRoles,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', membership.data.id)
      .eq('is_active', true);

    if (result.error) {
      throw new DatabaseException();
    }
  }

  public async hasRole(
    userId: string,
    organizationId: string,
    role: RolesEnum,
  ): Promise<boolean> {
    const result = await this.databaseService
      .from('memberships')
      .select('roles')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (!result.data) {
      return false;
    }

    const roles = result.data.roles as RolesEnum[];
    return roles.includes(role);
  }

  private mapToEntity(
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
