import React, { useState } from "react";
import { toast } from "react-toastify";
import { useWeb3 } from "../context/Web3Context";
import { uploadFileToPinata, uploadJsonToPinata, getIpfsUrl, isPinataConfigured } from "../utils/ipfs";
import { parseContractError, shortHash, RECORD_TYPES } from "../utils/helpers";

export default function DoctorPage() {
  const { contract, account, isDoctor } = useWeb3();

  const [patientAddress, setPatientAddress] = useState("");
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [loadedPatient, setLoadedPatient] = useState("");

  // Add record
  const [recordType, setRecordType] = useState("Blood Test");
  const [recordFile, setRecordFile] = useState(null);
  const [recordNotes, setRecordNotes] = useState("");
  const [addingRecord, setAddingRecord] = useState(false);

  const fetchPatientRecords = async () => {
    if (!contract || !patientAddress) return;
    setRecordsLoading(true);
    try {
      const [hashes, types, authors] = await contract.getPatientRecords(patientAddress);
      const list = hashes.map((h, i) => ({
        id: i,
        ipfsHash: h,
        recordType: types[i],
        addedBy: authors[i],
      }));
      setRecords(list.reverse());
      setLoadedPatient(patientAddress);
    } catch (err) {
      toast.error(parseContractError(err));
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!contract || !loadedPatient) return;
    setAddingRecord(true);
    try {
      let ipfsHash = "";
      if (recordFile && isPinataConfigured()) {
        toast.info("Uploading file to IPFS…");
        ipfsHash = await uploadFileToPinata(recordFile);
      } else if (recordNotes) {
        const metadata = {
          recordType,
          notes: recordNotes,
          patientAddress: loadedPatient,
          doctorAddress: account,
          uploadedAt: new Date().toISOString(),
        };
        if (isPinataConfigured()) {
          ipfsHash = await uploadJsonToPinata(metadata, `${recordType}-doctor`);
        } else {
          ipfsHash = `demo-${Date.now()}-${recordType.replace(/\s+/g, "-").toLowerCase()}`;
          toast.warn("Pinata not configured — using demo hash.");
        }
      } else {
        toast.error("Provide a file or notes.");
        setAddingRecord(false);
        return;
      }

      const tx = await contract.addRecord(loadedPatient, ipfsHash, recordType);
      toast.info("Saving record on-chain…");
      await tx.wait();
      toast.success("Record added for patient!");
      setRecordFile(null);
      setRecordNotes("");
      fetchPatientRecords();
    } catch (err) {
      toast.error(parseContractError(err));
    } finally {
      setAddingRecord(false);
    }
  };

  if (!contract) {
    return <div className="max-w-3xl mx-auto px-4 py-10 text-center text-slate-500">Connect your wallet first.</div>;
  }

  if (!isDoctor) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🩺</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Doctor Access Required</h2>
        <p className="text-slate-500">Your wallet has not been registered as a doctor by the admin.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Doctor Panel</h1>
        <p className="text-slate-500 mt-1">Look up patient records and submit new entries.</p>
      </div>

      {/* Patient Lookup */}
      <div className="card">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span>🔍</span> Look Up Patient
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Patient wallet address (0x…)"
            value={patientAddress}
            onChange={(e) => setPatientAddress(e.target.value)}
            className="input-field flex-1"
          />
          <button
            onClick={fetchPatientRecords}
            disabled={recordsLoading || !patientAddress}
            className="btn-primary px-6"
          >
            {recordsLoading ? "Loading…" : "Load Records"}
          </button>
        </div>
      </div>

      {/* Records */}
      {loadedPatient && (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <span>📋</span> Records for Patient
                </h2>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{loadedPatient}</p>
              </div>
              <span className="badge-blue">{records.length} records</span>
            </div>

            {records.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-2">📭</div>
                No records found for this patient.
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
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, idx) => (
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-3 text-slate-500">{records.length - idx}</td>
                        <td className="py-3 px-3"><span className="badge-blue">{r.recordType}</span></td>
                        <td className="py-3 px-3 font-mono text-slate-600 text-xs">{shortHash(r.ipfsHash)}</td>
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
                            View ↗
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add Record for Patient */}
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span>➕</span> Add Record for This Patient
            </h2>
            <form onSubmit={handleAddRecord} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Record Type</label>
                <select value={recordType} onChange={(e) => setRecordType(e.target.value)} className="input-field">
                  {RECORD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Upload File</label>
                <input
                  type="file"
                  onChange={(e) => setRecordFile(e.target.files[0])}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  accept=".pdf,.jpg,.jpeg,.png,.dcm,.txt"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Notes</label>
                <textarea
                  rows={3}
                  placeholder="Clinical observations, diagnosis, treatment notes…"
                  value={recordNotes}
                  onChange={(e) => setRecordNotes(e.target.value)}
                  className="input-field resize-none"
                />
              </div>
              <button type="submit" disabled={addingRecord} className="btn-primary w-full py-3">
                {addingRecord ? "Uploading & Saving…" : "Submit Record"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
