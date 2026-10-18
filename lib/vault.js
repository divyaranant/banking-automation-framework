/**
 * Credential resolution, in priority order:
 *   1. HashiCorp Vault (KV v2)  - VAULT_ADDR + VAULT_TOKEN, secret at <mount>/data/banks/<bank>
 *   2. Environment variables    - BANK_USERNAME / BANK_PASSWORD (e.g. injected by Jenkins/GitHub Actions)
 *   3. null                     - global setup provisions a throw-away user (demo site only)
 *
 * Credentials are never stored in the repo or in bank folders.
 */
async function getCredentials(bankName) {
  const { VAULT_ADDR, VAULT_TOKEN, VAULT_MOUNT = 'secret', VAULT_NAMESPACE } = process.env;

  if (VAULT_ADDR && VAULT_TOKEN) {
    const url = `${VAULT_ADDR.replace(/\/$/, '')}/v1/${VAULT_MOUNT}/data/banks/${bankName}`;
    const headers = { 'X-Vault-Token': VAULT_TOKEN };
    if (VAULT_NAMESPACE) headers['X-Vault-Namespace'] = VAULT_NAMESPACE;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Vault read failed for ${bankName}: ${res.status} ${res.statusText}`);
    }
    const { data } = await res.json();
    const { username, password } = data.data;
    if (!username || !password) throw new Error(`Vault secret for ${bankName} lacks username/password`);
    return { username, password, source: 'vault' };
  }

  if (process.env.BANK_USERNAME && process.env.BANK_PASSWORD) {
    return { username: process.env.BANK_USERNAME, password: process.env.BANK_PASSWORD, source: 'env' };
  }

  return null;
}

module.exports = { getCredentials };
