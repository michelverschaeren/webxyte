/** Spiegelt `CustomerLoginStatus` in server/utils/customer-login.ts. */
export type CustomerLoginStatus = "no-email" | "not-invited" | "invited" | "active";

export const loginStatusLabel: Record<CustomerLoginStatus, string> = {
  "no-email": "Geen e-mailadres",
  "not-invited": "Niet uitgenodigd",
  invited: "Uitgenodigd",
  active: "Actief",
};

/** Badgekleur per loginstatus (klassen uit app/assets/css/admin.css). */
export const LOGIN_BADGE: Record<CustomerLoginStatus, string> = {
  "no-email": "adm-badge--danger",
  "not-invited": "adm-badge--neutral",
  invited: "adm-badge--warning",
  active: "adm-badge--success",
};
