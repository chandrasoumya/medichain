/**
 * Format a wallet address for display: 0x1234...5678
 */
export function formatAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format a unix timestamp to readable date.
 */
export function formatTimestamp(ts) {
  if (!ts) return "—";
  const date = new Date(Number(ts) * 1000);
  return date.toLocaleString();
}

/**
 * Parse smart contract error messages to be user-friendly.
 */
export function parseContractError(err) {
  if (!err) return "Unknown error occurred";

  const msg = err?.reason || err?.message || String(err);

  // Common patterns
  if (msg.includes("user rejected")) return "Transaction rejected by user.";
  if (msg.includes("Patient already registered")) return "This wallet is already registered as a patient.";
  if (msg.includes("Doctor already registered")) return "This address is already a registered doctor.";
  if (msg.includes("Patient is not registered")) return "Patient is not registered on the system.";
  if (msg.includes("Caller is not the admin")) return "Only the admin can perform this action.";
  if (msg.includes("Doctor not authorized by patient")) return "Doctor has not been granted access by the patient.";
  if (msg.includes("Access was not granted")) return "Cannot revoke access that was never granted.";
  if (msg.includes("Provider is not a valid registered doctor")) return "The specified address is not a registered doctor.";
  if (msg.includes("Access Denied")) return "You do not have permission to view these records.";
  if (msg.includes("insufficient funds")) return "Insufficient ETH balance for this transaction.";
  if (msg.includes("Reentrancy detected")) return "Reentrancy detected. Please try again.";

  // Fallback: extract the revert reason if wrapped
  const revertMatch = msg.match(/reverted with reason string '(.+?)'/);
  if (revertMatch) return revertMatch[1];

  return msg.length > 120 ? msg.slice(0, 120) + "..." : msg;
}

/**
 * Record type options for the UI.
 */
export const RECORD_TYPES = [
  "Blood Test",
  "X-Ray",
  "MRI",
  "CT Scan",
  "Ultrasound",
  "Prescription",
  "Lab Report",
  "Discharge Summary",
  "Vaccination Record",
  "Allergy Report",
  "Consultation Notes",
  "Surgery Report",
  "ECG",
  "Pathology Report",
  "Other",
];

/**
 * Shorten an IPFS hash for display.
 */
export function shortHash(hash) {
  if (!hash || hash.length < 20) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}
