export enum SubscriptionTierEnum {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
}

export const TIER_HIERARCHY: Record<SubscriptionTierEnum, number> = {
  [SubscriptionTierEnum.FREE]: 0,
  [SubscriptionTierEnum.BASIC]: 1,
  [SubscriptionTierEnum.PRO]: 2,
};
