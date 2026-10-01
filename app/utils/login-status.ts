/** Spiegelt `CustomerLoginStatus` in server/utils/customer-login.ts. */
export type CustomerLoginStatus = "no-email" | "not-invited" | "invited" | "active";

export const loginStatusLabel: Record<CustomerLoginStatus, string> = {
  "no-email": "Geen e-mailadres",
  "not-invited": "Niet uitgenodigd",
  invited: "Uitgenodigd",
  active: "Actief",
};
