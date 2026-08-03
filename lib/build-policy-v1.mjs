const SHA40 = /^[0-9a-f]{40}$/i;
const DIGEST = /^sha256:[0-9a-f]{64}$/i;

export function validateAttestationManifest(manifest, { attestation = false } = {}) {
  const errors = [];
  if (!manifest?.source?.repository) errors.push('source.repository is required');
  if (!manifest?.source?.commit) errors.push('source.commit is required');
  if (!Array.isArray(manifest?.commands) || manifest.commands.length === 0) errors.push('commands must be a non-empty array');

  if (attestation) {
    if (!SHA40.test(manifest.source?.commit || '')) errors.push('attestation mode requires an exact 40-character commit SHA');
    if (!DIGEST.test(manifest.environment?.imageDigest || '')) errors.push('attestation mode requires environment.imageDigest');
    if (manifest.network !== 'none') errors.push('attestation mode requires network=none');
    if (manifest.runAsRoot !== false) errors.push('attestation mode requires runAsRoot=false');
    if (!Number.isInteger(manifest.limits?.timeoutSeconds) || manifest.limits.timeoutSeconds <= 0) errors.push('positive limits.timeoutSeconds is required');
    if (!Array.isArray(manifest.expectedArtifacts) || manifest.expectedArtifacts.length === 0) errors.push('expectedArtifacts is required');
  }

  for (const command of manifest?.commands || []) {
    if (typeof command !== 'string' || !command.trim()) errors.push('commands must contain non-empty strings');
    if (attestation && /\b(curl|wget|nc|netcat|ssh|scp)\b/i.test(command)) errors.push('network-capable command rejected in attestation mode');
  }

  return { valid: errors.length === 0, errors };
}
