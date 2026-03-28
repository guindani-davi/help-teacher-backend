export enum SubscriptionTierEnum {
  BASIC = 'basic',
  PRO = 'pro',
}

export const TIER_HIERARCHY: Record<SubscriptionTierEnum, number> = {
  [SubscriptionTierEnum.BASIC]: 1,
  [SubscriptionTierEnum.PRO]: 2,
};
