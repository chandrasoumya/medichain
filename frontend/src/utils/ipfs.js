import axios from "axios";

const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.REACT_APP_PINATA_SECRET_KEY;
const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;

const PINATA_BASE = "https://api.pinata.cloud";
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

/**
 * Upload a file to IPFS via Pinata.
 * Returns the IPFS CID hash.
 */
export async function uploadFileToPinata(file) {
  const formData = new FormData();
  formData.append("file", file);

  const metadata = JSON.stringify({
    name: file.name,
    keyvalues: { uploadedAt: new Date().toISOString() },
  });
  formData.append("pinataMetadata", metadata);

  const options = JSON.stringify({ cidVersion: 1 });
  formData.append("pinataOptions", options);

  const headers = PINATA_JWT
    ? { Authorization: `Bearer ${PINATA_JWT}` }
    : {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      };

  const response = await axios.post(
    `${PINATA_BASE}/pinning/pinFileToIPFS`,
    formData,
    { headers }
  );

  return response.data.IpfsHash;
}

/**
 * Upload JSON metadata to IPFS via Pinata.
 */
export async function uploadJsonToPinata(jsonData, name = "ehr-record") {
  const headers = PINATA_JWT
    ? {
        Authorization: `Bearer ${PINATA_JWT}`,
        "Content-Type": "application/json",
      }
    : {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
        "Content-Type": "application/json",
      };

  const body = {
    pinataContent: jsonData,
    pinataMetadata: { name },
    pinataOptions: { cidVersion: 1 },
  };

  const response = await axios.post(
    `${PINATA_BASE}/pinning/pinJSONToIPFS`,
    body,
    { headers }
  );

  return response.data.IpfsHash;
}

/**
 * Get IPFS gateway URL from hash.
 */
export function getIpfsUrl(hash) {
  if (!hash) return "";
  if (hash.startsWith("http")) return hash;
  return `${IPFS_GATEWAY}${hash}`;
}

/**
 * Fetch JSON content from IPFS.
 */
export async function fetchFromIPFS(hash) {
  try {
    const url = getIpfsUrl(hash);
    const response = await axios.get(url, { timeout: 15000 });
    return response.data;
  } catch (err) {
    console.error("IPFS fetch error:", err);
    return null;
  }
}

/**
 * Check if Pinata credentials are configured.
 */
export function isPinataConfigured() {
  return !!(PINATA_JWT || (PINATA_API_KEY && PINATA_SECRET_KEY));
}
