/**
 * Centralised subscription helpers.
 *
 * Every place that needs to decide "is this user an Elite / paid member?"
 * should call `isEliteStatus(status)` instead of doing its own string comparison.
 * This way, adding a new status value means touching exactly one file.
 */

/** All status strings that grant Elite ("paid") access. */
const ELITE_STATUSES: ReadonlySet<string> = new Set([
    "active",
    "paid",
    "pro",
    "on_trial",
    "trialing",
]);

/**
 * Returns `true` when the given `subscriptionStatus` value represents
 * a paid / Elite tier.
 */
export function isEliteStatus(status: string | null | undefined): boolean {
    return !!status && ELITE_STATUSES.has(status);
}
