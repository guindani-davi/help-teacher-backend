import { SetMetadata } from '@nestjs/common';
import { SubscriptionTierEnum } from '../enums/subscription-tier.enum';

export const ALLOWED_TIERS_KEY = 'allowed_tiers';

export const AllowedTiers = (
  ...tiers: [SubscriptionTierEnum, ...SubscriptionTierEnum[]]
) => SetMetadata(ALLOWED_TIERS_KEY, tiers);
