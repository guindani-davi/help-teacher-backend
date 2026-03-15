import { SetMetadata } from '@nestjs/common';
import { SubscriptionTierEnum } from '../enums/subscription-tier.enum';

export const REQUIRED_TIER_KEY = 'required_tier';

export const RequiredTier = (tier: SubscriptionTierEnum) =>
  SetMetadata(REQUIRED_TIER_KEY, tier);
