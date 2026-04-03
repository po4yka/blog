// D1 helpers for WebAuthn credential and challenge storage.

export interface StoredCredential {
  credentialID: string;
  publicKey: string;
  counter: number;
  transports: string[];
}

// --- Challenges ---

export async function storeChallenge(
  db: D1Database,
  challenge: string,
  type: string,
): Promise<void> {
  await db
    .prepare("INSERT INTO auth_challenges (challenge, type) VALUES (?, ?)")
    .bind(challenge, type)
    .run();
}

export async function consumeChallenge(
  db: D1Database,
  challenge: string,
  type: string,
): Promise<boolean> {
  const row = await db
    .prepare(
      "SELECT challenge FROM auth_challenges WHERE challenge = ? AND type = ? AND created_at > datetime('now', '-5 minutes')",
    )
    .bind(challenge, type)
    .first();

  if (!row) return false;

  await db
    .prepare("DELETE FROM auth_challenges WHERE challenge = ?")
    .bind(challenge)
    .run();

  return true;
}

// --- Credentials ---

export async function storeCredential(
  db: D1Database,
  credentialID: string,
  publicKey: string,
  counter: number,
  transports: string[],
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO admin_credentials (credential_id, public_key, counter, transports) VALUES (?, ?, ?, ?)",
    )
    .bind(credentialID, publicKey, counter, JSON.stringify(transports))
    .run();
}

export async function getCredentials(db: D1Database): Promise<StoredCredential[]> {
  const { results } = await db
    .prepare("SELECT credential_id, public_key, counter, transports FROM admin_credentials")
    .all<{ credential_id: string; public_key: string; counter: number; transports: string | null }>();

  return results.map((r: { credential_id: string; public_key: string; counter: number; transports: string | null }) => ({
    credentialID: r.credential_id,
    publicKey: r.public_key,
    counter: r.counter,
    transports: r.transports ? (JSON.parse(r.transports) as string[]) : [],
  }));
}

export async function getCredentialById(
  db: D1Database,
  credentialID: string,
): Promise<StoredCredential | null> {
  const row = await db
    .prepare(
      "SELECT credential_id, public_key, counter, transports FROM admin_credentials WHERE credential_id = ?",
    )
    .bind(credentialID)
    .first<{ credential_id: string; public_key: string; counter: number; transports: string | null }>();

  if (!row) return null;

  return {
    credentialID: row.credential_id,
    publicKey: row.public_key,
    counter: row.counter,
    transports: row.transports ? (JSON.parse(row.transports) as string[]) : [],
  };
}

export async function updateCredentialCounter(
  db: D1Database,
  credentialID: string,
  counter: number,
): Promise<void> {
  await db
    .prepare("UPDATE admin_credentials SET counter = ? WHERE credential_id = ?")
    .bind(counter, credentialID)
    .run();
}

export async function hasAnyCredential(db: D1Database): Promise<boolean> {
  const row = await db
    .prepare("SELECT COUNT(*) as cnt FROM admin_credentials")
    .first<{ cnt: number }>();
  return (row?.cnt ?? 0) > 0;
}
