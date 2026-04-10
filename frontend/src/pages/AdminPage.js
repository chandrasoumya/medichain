import React, { useState } from "react";
import { toast } from "react-toastify";
import { useWeb3 } from "../context/Web3Context";
import { parseContractError, formatAddress } from "../utils/helpers";

export default function AdminPage() {
  const { contract, account, isAdmin } = useWeb3();

  const [newDoctor, setNewDoctor] = useState("");
  const [removeDoctor, setRemoveDoctor] = useState("");
  const [checkAddress, setCheckAddress] = useState("");
  const [checkResult, setCheckResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddDoctor = async () => {
    if (!contract || !newDoctor) return;
    setLoading(true);
    try {
      const tx = await contract.addDoctor(newDoctor);
      toast.info("Transaction submitted…");
      await tx.wait();
      toast.success(`Doctor registered: ${formatAddress(newDoctor)}`);
      setNewDoctor("");
    } catch (err) {
      toast.error(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDoctor = async () => {
    if (!contract || !removeDoctor) return;
    setLoading(true);
    try {
      const tx = await contract.removeDoctor(removeDoctor);
      toast.info("Transaction submitted…");
      await tx.wait();
      toast.success(`Doctor removed: ${formatAddress(removeDoctor)}`);
      setRemoveDoctor("");
    } catch (err) {
      toast.error(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAddress = async () => {
    if (!contract || !checkAddress) return;
    setLoading(true);
    try {
      const [isDoc, isPat, adminAddr] = await Promise.all([
        contract.isDoctorValid(checkAddress),
        contract.isPatientRegistered(checkAddress),
        contract.admin(),
      ]);
      setCheckResult({
        address: checkAddress,
        isDoctor: isDoc,
        isPatient: isPat,
        isAdmin: adminAddr.toLowerCase() === checkAddress.toLowerCase(),
      });
    } catch (err) {
      toast.error(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!contract) {
    return <div className="max-w-3xl mx-auto px-4 py-10 text-center text-slate-500">Connect your wallet first.</div>;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">⚙️</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Admin Access Required</h2>
        <p className="text-slate-500">Only the contract deployer (admin) can access this panel.</p>
        <p className="text-xs font-mono text-slate-400 mt-4 bg-slate-50 px-3 py-2 rounded-lg">
          Your address: {account}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Console</h1>
        <p className="text-slate-500 mt-1">Manage system roles and configurations.</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 text-sm text-purple-700">
          <span>⚙️</span>
          <span className="font-medium">Admin Address:</span>
          <span className="font-mono">{formatAddress(account)}</span>
        </div>
      </div>

      {/* Add Doctor */}
      <div className="card">
        <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <span className="text-emerald-500">➕</span> Register New Doctor
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Grant a wallet address the doctor role. Doctors can view and add records for authorized patients.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Doctor's wallet address (0x…)"
            value={newDoctor}
            onChange={(e) => setNewDoctor(e.target.value)}
            className="input-field flex-1"
          />
          <button
            onClick={handleAddDoctor}
            disabled={loading || !newDoctor}
            className="btn-primary px-6"
          >
            {loading ? "Processing…" : "Add Doctor"}
          </button>
        </div>
      </div>

      {/* Remove Doctor */}
      <div className="card">
        <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <span className="text-red-500">🚫</span> Remove Doctor
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Deactivate a doctor's access. They will no longer be able to add or view patient records.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Doctor's wallet address (0x…)"
            value={removeDoctor}
            onChange={(e) => setRemoveDoctor(e.target.value)}
            className="input-field flex-1"
          />
          <button
            onClick={handleRemoveDoctor}
            disabled={loading || !removeDoctor}
            className="btn-danger px-6"
          >
            {loading ? "Processing…" : "Remove Doctor"}
          </button>
        </div>
      </div>

      {/* Address Checker */}
      <div className="card">
        <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <span>🔍</span> Address Role Checker
        </h2>
        <p className="text-xs text-slate-500 mb-4">Check what roles are assigned to any wallet address.</p>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Any wallet address (0x…)"
            value={checkAddress}
            onChange={(e) => setCheckAddress(e.target.value)}
            className="input-field flex-1"
          />
          <button
            onClick={handleCheckAddress}
            disabled={loading || !checkAddress}
            className="btn-secondary px-6"
          >
            {loading ? "Checking…" : "Check"}
          </button>
        </div>
        {checkResult && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs font-mono text-slate-500 mb-3">{checkResult.address}</p>
            <div className="flex flex-wrap gap-2">
              {checkResult.isAdmin && <span className="badge-purple">⚙️ Admin</span>}
              {checkResult.isDoctor && <span className="badge-blue">🩺 Doctor</span>}
              {checkResult.isPatient && <span className="badge-green">👤 Patient</span>}
              {!checkResult.isAdmin && !checkResult.isDoctor && !checkResult.isPatient && (
                <span className="badge-red">No roles assigned</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <span className="text-amber-500 text-xl">⚠️</span>
        <div>
          <p className="text-amber-800 font-medium text-sm">Important Notes</p>
          <ul className="text-amber-700 text-sm mt-1 list-disc list-inside space-y-1">
            <li>Doctor removal is non-destructive — existing records remain on-chain.</li>
            <li>The admin role cannot be transferred in this contract version.</li>
            <li>Each transaction costs gas; use Sepolia testnet for free testing.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
