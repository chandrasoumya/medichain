import React, { useState } from "react";
import { toast } from "react-toastify";
import { useWeb3 } from "../context/Web3Context";
import { parseContractError, shortHash } from "../utils/helpers";
import { getIpfsUrl } from "../utils/ipfs";

export default function RecordsPage() {
  const { contract, account } = useWeb3();

  const [targetAddress, setTargetAddress] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [statusInfo, setStatusInfo] = useState(null);

  const handleSearch = async () => {
    if (!contract || !targetAddress) return;
    setLoading(true);
    setSearched(false);
    try {
      // Check if registered
      const isReg = await contract.isPatientRegistered(targetAddress);
      const isAuthed = await contract.isAuthorized(targetAddress, account);
      const isSelf = targetAddress.toLowerCase() === account?.toLowerCase();

      setStatusInfo({ isReg, isAuthed, isSelf });

      if (!isReg) {
        toast.warn("This address is not a registered patient.");
        setRecords([]);
        setSearched(true);
        return;
      }

      const [hashes, types, authors] = await contract.getPatientRecords(targetAddress);
      const list = hashes.map((h, i) => ({
        id: i,
        ipfsHash: h,
        recordType: types[i],
        addedBy: authors[i],
      }));
      setRecords(list.reverse());
      setSearched(true);
    } catch (err) {
      toast.error(parseContractError(err));
      setRecords([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const typeColors = {
    "Blood Test": "badge-red",
    "X-Ray": "badge-blue",
    "MRI": "badge-purple",
    "CT Scan": "badge-purple",
    "Prescription": "badge-green",
    default: "badge-blue",
  };

  const getBadgeClass = (type) => typeColors[type] || typeColors.default;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">View Patient Records</h1>
        <p className="text-slate-500 mt-1">
          You can view your own records or a patient's records if they have granted you access.
        </p>
      </div>

      {/* Search */}
      <div className="card">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span>🔍</span> Search Patient Records
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Patient wallet address (0x…)"
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            className="input-field flex-1"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !targetAddress || !contract}
            className="btn-primary px-6"
          >
            {loading ? "Loading…" : "Search"}
          </button>
        </div>

        {/* Quick: view own */}
        {account && (
          <button
            onClick={() => {
              setTargetAddress(account);
            }}
            className="mt-3 text-sm text-primary-600 hover:underline"
          >
            → Use my own address
          </button>
        )}
      </div>

      {/* Status Info */}
      {searched && statusInfo && (
        <div className={`rounded-xl p-4 border flex gap-3 ${statusInfo.isReg ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <span className="text-xl">{statusInfo.isReg ? "✅" : "❌"}</span>
          <div>
            <p className={`font-medium text-sm ${statusInfo.isReg ? "text-emerald-800" : "text-red-800"}`}>
              {statusInfo.isReg ? "Patient is registered" : "Address is not a registered patient"}
            </p>
            {statusInfo.isReg && (
              <p className="text-sm mt-1 text-slate-600">
                Access:{" "}
                {statusInfo.isSelf ? (
                  <span className="badge-green">Owner</span>
                ) : statusInfo.isAuthed ? (
                  <span className="badge-green">Authorized</span>
                ) : (
                  <span className="badge-red">Not Authorized</span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {searched && records.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <span>📋</span> Records Found
            </h2>
            <span className="badge-blue">{records.length} records</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {records.map((r, idx) => (
              <div
                key={r.id}
                className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={getBadgeClass(r.recordType)}>{r.recordType}</span>
                  <span className="text-xs text-slate-400">#{records.length - idx}</span>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-slate-500 mb-1">IPFS Hash</p>
                  <p className="font-mono text-xs text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 break-all">
                    {r.ipfsHash}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-slate-500 mb-1">Added By</p>
                  <p className="font-mono text-xs text-slate-600">
                    {r.addedBy.toLowerCase() === account?.toLowerCase()
                      ? "You (patient/doctor)"
                      : shortHash(r.addedBy)}
                  </p>
                </div>
                <a
                  href={getIpfsUrl(r.ipfsHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-primary-600 text-xs hover:underline"
                >
                  🌐 Open on IPFS Gateway
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {searched && records.length === 0 && statusInfo?.isReg && (
        <div className="card text-center py-10">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-slate-500">No records found for this patient.</p>
        </div>
      )}

      {/* Legend */}
      {!searched && (
        <div className="card bg-slate-50">
          <h3 className="font-medium text-slate-700 mb-3">Access Rules</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="badge-green">Owner</span>
              <span>Patients can always view their own records.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-blue">Doctor</span>
              <span>Doctors can view records only if the patient has granted them access.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-red">Blocked</span>
              <span>All other addresses are denied access by the smart contract.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
