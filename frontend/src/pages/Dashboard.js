import React from "react";
import { Link } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { formatAddress } from "../utils/helpers";

export default function Dashboard() {
  const { account, isAdmin, isDoctor, isPatient, connectWallet, isConnecting, refreshRoles } = useWeb3();

  if (!account) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-slate-100 px-4">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">MediChain</h1>
          <p className="text-lg text-slate-600 mb-2">Secure, Patient-Centric Electronic Health Records</p>
          <p className="text-sm text-slate-500 mb-8">Powered by Ethereum · IPFS · Role-Based Access Control</p>
          <button onClick={connectWallet} disabled={isConnecting} className="btn-primary text-base px-8 py-3">
            {isConnecting ? "Connecting…" : "🦊 Connect MetaMask"}
          </button>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { icon: "🔐", title: "Decentralized", desc: "Records stored on-chain & IPFS" },
              { icon: "🏥", title: "Role-Based", desc: "Admin · Doctor · Patient access" },
              { icon: "🔑", title: "Patient-Owned", desc: "You control who sees your data" },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="font-semibold text-sm text-slate-800">{f.title}</div>
                <div className="text-xs text-slate-500 mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const cards = [
    {
      show: true,
      icon: "👤",
      title: "My Status",
      desc: isPatient ? "You are registered as a patient." : "Register to manage your health records.",
      link: "/patient",
      linkLabel: isPatient ? "Go to My Records →" : "Register as Patient →",
      color: "border-l-4 border-emerald-500",
    },
    {
      show: isDoctor,
      icon: "🩺",
      title: "Doctor Panel",
      desc: "View patient records and add medical entries.",
      link: "/doctor",
      linkLabel: "Open Doctor Panel →",
      color: "border-l-4 border-blue-500",
    },
    {
      show: isAdmin,
      icon: "⚙️",
      title: "Admin Console",
      desc: "Manage doctors and system configuration.",
      link: "/admin",
      linkLabel: "Open Admin Console →",
      color: "border-l-4 border-purple-500",
    },
    {
      show: true,
      icon: "📂",
      title: "View Records",
      desc: "Access patient records (requires authorization).",
      link: "/records",
      linkLabel: "View Records →",
      color: "border-l-4 border-orange-500",
    },
  ].filter((c) => c.show);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Connected as{" "}
          <span className="font-mono text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
            {formatAddress(account)}
          </span>
        </p>
      </div>

      {/* Role Summary */}
      <div className="card mb-8">
        <h2 className="font-semibold text-slate-700 mb-4">Your Roles</h2>
        <div className="flex flex-wrap gap-3">
          {isAdmin && (
            <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg border border-purple-200">
              <span>⚙️</span> <span className="font-medium">Administrator</span>
            </div>
          )}
          {isDoctor && (
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200">
              <span>🩺</span> <span className="font-medium">Doctor</span>
            </div>
          )}
          {isPatient && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-200">
              <span>👤</span> <span className="font-medium">Registered Patient</span>
            </div>
          )}
          {!isAdmin && !isDoctor && !isPatient && (
            <div className="flex items-center gap-2 bg-slate-50 text-slate-500 px-4 py-2 rounded-lg border border-slate-200">
              <span>❓</span> <span className="font-medium">No role assigned</span>
            </div>
          )}
          <button
            onClick={refreshRoles}
            className="btn-secondary text-sm py-2"
            title="Refresh roles from blockchain"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div key={c.title} className={`card ${c.color} hover:shadow-md transition-shadow`}>
            <div className="text-3xl mb-3">{c.icon}</div>
            <h3 className="font-semibold text-slate-800 text-lg mb-1">{c.title}</h3>
            <p className="text-slate-500 text-sm mb-4">{c.desc}</p>
            {c.link && (
              <Link to={c.link} className="text-primary-600 font-medium text-sm hover:underline">
                {c.linkLabel}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Info Banner */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <span className="text-blue-500 text-xl">ℹ️</span>
        <div>
          <p className="text-blue-800 font-medium text-sm">How it works</p>
          <p className="text-blue-700 text-sm mt-1">
            Medical records are encrypted and stored on IPFS. Only the CID hash is written to the blockchain. 
            Patients grant or revoke doctor access at any time — no central authority controls your data.
          </p>
        </div>
      </div>
    </div>
  );
}