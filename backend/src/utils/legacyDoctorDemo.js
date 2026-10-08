const legacyDemoEmails = () =>
  (process.env.LEGACY_DOCTOR_DEMO_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export function isLegacyDoctorDemoEnabled(email) {
  const normalizedEmail = email?.trim().toLowerCase();
  const localDemoEnabled =
    process.env.NODE_ENV === "development" &&
    process.env.ALLOW_LEGACY_DOCTOR_DEMO === "true";
  const explicitlyAllowlisted =
    normalizedEmail && legacyDemoEmails().includes(normalizedEmail);

  return Boolean(localDemoEnabled || explicitlyAllowlisted);
}