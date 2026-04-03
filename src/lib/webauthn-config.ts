// WebAuthn Relying Party configuration.
// RP ID must match the domain where passkeys are registered.

export const rpName = "po4yka.dev Admin";
export const rpID = import.meta.env.PROD ? "po4yka.dev" : "localhost";
export const expectedOrigin = import.meta.env.PROD
  ? "https://po4yka.dev"
  : "http://localhost:4321";
