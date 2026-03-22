import { SubscriptionTierEnum } from '../../subscriptions/enums/subscription-tier.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  subscriptionTier: SubscriptionTierEnum;
}
