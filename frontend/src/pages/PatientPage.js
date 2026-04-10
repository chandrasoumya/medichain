import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useWeb3 } from "../context/Web3Context";
import { uploadFileToPinata, uploadJsonToPinata, getIpfsUrl, isPinataConfigured } from "../utils/ipfs";
import { parseContractError, formatTimestamp, shortHash, RECORD_TYPES } from "../utils/helpers";

export default function PatientPage() {
  const { contract, account, isPatient, refreshRoles } = useWeb3();

  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Access management
  const [providerAddress, setProviderAddress] = useState("");
  const [revokeAddress, setRevokeAddress] = useState("");

  // Add record form
  const [recordType, setRecordType] = useState("Blood Test");
  const [recordFile, setRecordFile] = useState(null);
  const [recordNotes, setRecordNotes] = useState("");
  const [addingRecord, setAddingRecord] = useState(false);

  const fetchMyRecords = useCallback(async () => {
    if (!contract || !account || !isPatient) return;
    setRecordsLoading(true);
    try {
      const [hashes, types, authors] = await contract.getPatientRecords(account);
      const count = await contract.getRecordCount(account);
      const list = [];
      for (let i = 0; i < hashes.length; i++) {
        list.push({
          id: i,
          ipfsHash: hashes[i],
          recordType: types[i],
          addedBy: authors[i],
        });
      }
      setRecords(list.reverse());
    } catch (err) {
      toast.error(parseContractError(err));
    } finally {
      setRecordsLoading(false);
    }
  }, [contract, account, isPatient]);

  useEffect(() => {
    fetchMyRecords();
  }, [fetchMyRecords]);

  const handleRegister = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.registerPatient();
      toast.info("Transaction submitted. Waiting for confirmation…");
      await tx.wait();
      toast.success("Successfully registered as a patient!");
      await refreshRoles();
    } catch (err) {
      toast.error(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!contract || !providerAddress) return;
    setLoading(true);
    try {
      const tx = await contract.grantAccess(providerAddress);
      toast.info("Transaction submitted…");
      await tx.wait();
      toast.success(`Access granted to ${providerAddress.slice(0, 10)}…`);
      setProviderAddress("");
    } catch (err) {
      toast.error(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!contract || !revokeAddress) return;
    setLoading(true);
    try {
      const tx = await contract.revokeAccess(revokeAddress);
      toast.info("Transaction submitted…");
      await tx.wait();
      toast.success(`Access revoked from ${revokeAddress.slice(0, 10)}…`);
      setRevokeAddress("");
    } catch (err) {
      toast.error(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!contract) return;
    setAddingRecord(true);
    try {
      let ipfsHash = "";

      if (recordFile && isPinataConfigured()) {
        toast.info("Uploading file to IPFS via Pinata…");
        ipfsHash = await uploadFileToPinata(recordFile);
        toast.success(`File uploaded! CID: ${shortHash(ipfsHash)}`);
      } else if (recordNotes) {
        // Upload JSON metadata with notes
        const metadata = {
          recordType,
          notes: recordNotes,
          patientAddress: account,
          uploadedAt: new Date().toISOString(),
        };
        if (isPinataConfigured()) {
          toast.info("Uploading metadata to IPFS…");
          ipfsHash = await uploadJsonToPinata(metadata, `${recordType}-${Date.now()}`);
        } else {
          // Fallback: use a placeholder hash for demo without Pinata
          ipfsHash = `demo-${Date.now()}-${recordType.replace(/\s+/g, "-").toLowerCase()}`;
          toast.warn("Pinata not configured. Using demo hash. Configure REACT_APP_PINATA_JWT in .env for real IPFS uploads.");
        }
      } else {
        toast.error("Please upload a file or enter notes.");
        setAddingRecord(false);
        return;
      }

      const tx = await contract.addRecord(account, ipfsHash, recordType);
      toast.info("Saving record to blockchain…");
      await tx.wait();
      toast.success("Record added successfully!");
      setRecordFile(null);
      setRecordNotes("");
      setRecordType("Blood Test");
      fetchMyRecords();
    } catch (err) {
      toast.error(parseContractError(err));
    } finally {
      setAddingRecord(false);
    }
  };

  if (!contract) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <p className="text-slate-500">Please connect your wallet first.</p>
      </div>
    );
  }

  if (!isPatient) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🏥</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Register as a Patient</h2>
        <p className="text-slate-500 mb-6">
          Register your wallet address on the blockchain to start managing your health records.
        </p>
        <button onClick={handleRegister} disabled={loading} className="btn-primary px-8 py-3">
          {loading ? "Registering…" : "Register Now"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Health Records</h1>
        <p className="text-slate-500 mt-1">Manage your records and control doctor access.</p>
      </div>

      {/* Access Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Grant */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <span className="text-emerald-500">✅</span> Grant Access
          </h2>
          <p className="text-xs text-slate-500 mb-4">Allow a registered doctor to view and add your records.</p>
          <input
            type="text"
            placeholder="Doctor's wallet address (0x...)"
            value={providerAddress}
            onChange={(e) => setProviderAddress(e.target.value)}
            className="input-field mb-3"
          />
          <button
            onClick={handleGrantAccess}
            disabled={loading || !providerAddress}
            className="btn-primary w-full"
          >
            {loading ? "Processing…" : "Grant Access"}
          </button>
        </div>

        {/* Revoke */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <span className="text-red-500">🚫</span> Revoke Access
          </h2>
          <p className="text-xs text-slate-500 mb-4">Remove a doctor's permission to access your records.</p>
          <input
            type="text"
            placeholder="Doctor's wallet address (0x...)"
            value={revokeAddress}
            onChange={(e) => setRevokeAddress(e.target.value)}
            className="input-field mb-3"
          />
          <button
            onClick={handleRevokeAccess}
            disabled={loading || !revokeAddress}
            className="btn-danger w-full"
          >
            {loading ? "Processing…" : "Revoke Access"}
          </button>
        </div>
      </div>

      {/* Add Record */}
      <div className="card">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span>📎</span> Add New Record
        </h2>
        <form onSubmit={handleAddRecord} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Record Type</label>
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              className="input-field"
            >
              {RECORD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Upload File <span className="text-slate-400 font-normal">(requires Pinata API keys)</span>
            </label>
            <input
              type="file"
              onChange={(e) => setRecordFile(e.target.files[0])}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              accept=".pdf,.jpg,.jpeg,.png,.dcm,.txt"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes / Description <span className="text-slate-400 font-normal">(used if no file)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Enter any notes or details about this record…"
              value={recordNotes}
              onChange={(e) => setRecordNotes(e.target.value)}
              className="input-field resize-none"
            />
          </div>
          <button type="submit" disabled={addingRecord} className="btn-primary w-full py-3">
            {addingRecord ? "Uploading & Saving…" : "Add Record to Blockchain"}
          </button>
        </form>
      </div>

      {/* Records List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <span>📋</span> My Records ({records.length})
          </h2>
          <button onClick={fetchMyRecords} className="btn-secondary text-sm py-1">
            🔄 Refresh
          </button>
        </div>

        {recordsLoading ? (
          <div className="text-center py-8 text-slate-400">Loading records…</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-slate-500">No records found. Add your first record above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-slate-600 font-medium">#</th>
                  <th className="text-left py-2 px-3 text-slate-600 font-medium">Type</th>
                  <th className="text-left py-2 px-3 text-slate-600 font-medium">IPFS Hash</th>
                  <th className="text-left py-2 px-3 text-slate-600 font-medium">Added By</th>
                  <th className="text-left py-2 px-3 text-slate-600 font-medium">View</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-3 text-slate-500">{records.length - idx}</td>
                    <td className="py-3 px-3">
                      <span className="badge-blue">{r.recordType}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{shortHash(r.ipfsHash)}</td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-500">
                      {r.addedBy.toLowerCase() === account.toLowerCase()
                        ? <span className="badge-green">You</span>
                        : `${r.addedBy.slice(0, 8)}…`}
                    </td>
                    <td className="py-3 px-3">
                      <a
                        href={getIpfsUrl(r.ipfsHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-600 hover:underline text-xs"
                      >
                        View on IPFS ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
