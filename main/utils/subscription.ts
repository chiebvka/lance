export type OrgSubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'trial'
  | 'incomplete'
  | 'pending'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'cancelled'
  | 'incomplete_expired'
  | 'expired'
  | 'suspended'
  | string

export function isOrgSubscriptionActive(
  status: OrgSubscriptionStatus | null | undefined,
  trialEndsAt?: string | null
): boolean {
  const normalized = (status || '').toLowerCase();

  // Always-allowed statuses
  const allowed = new Set<OrgSubscriptionStatus>(['active', 'trialing', 'incomplete', 'pending']);
  if (allowed.has(normalized)) return true;

  // Backward-compatible legacy trial handling
  if (normalized === 'trial') {
    if (!trialEndsAt) return false;
    const end = new Date(trialEndsAt);
    return new Date() <= end;
  }

  return false;
}

export function deriveInactiveReason(
  status: OrgSubscriptionStatus | null | undefined,
  trialEndsAt?: string | null
): string {
  const normalized = (status || 'unknown').toLowerCase();
  if (normalized === 'trial' && trialEndsAt) {
    const end = new Date(trialEndsAt);
    if (new Date() > end) return 'trial_expired';
  }
  return normalized;
}


