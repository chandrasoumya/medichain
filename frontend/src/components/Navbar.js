import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { formatAddress } from "../utils/helpers";

export default function Navbar() {
  const { account, isAdmin, isDoctor, isPatient, connectWallet, disconnectWallet, isConnecting, chainId } = useWeb3();
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Dashboard" },
    ...(isPatient ? [{ path: "/patient", label: "My Records" }] : []),
    ...(isDoctor ? [{ path: "/doctor", label: "Doctor Panel" }] : []),
    ...(isAdmin ? [{ path: "/admin", label: "Admin" }] : []),
    { path: "/records", label: "View Records" },
  ];

  const getRoleBadge = () => {
    if (isAdmin) return <span className="badge-purple">Admin</span>;
    if (isDoctor && isPatient) return <><span className="badge-blue mr-1">Doctor</span><span className="badge-green">Patient</span></>;
    if (isDoctor) return <span className="badge-blue">Doctor</span>;
    if (isPatient) return <span className="badge-green">Patient</span>;
    return <span className="badge-red">Unregistered</span>;
  };

  const getNetworkBadge = () => {
    if (!chainId) return null;
    if (chainId === "11155111") return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Sepolia</span>;
    if (chainId === "31337") return <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Localhost</span>;
    return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Wrong Network</span>;
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-slate-900">MediChain</span>
          </Link>

          {/* Nav Links */}
          {account && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? "bg-primary-50 text-primary-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Wallet */}
          <div className="flex items-center gap-3">
            {account ? (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  {getNetworkBadge()}
                  {getRoleBadge()}
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm font-mono text-slate-700">{formatAddress(account)}</span>
                </div>
                <button onClick={disconnectWallet} className="btn-secondary text-sm py-1.5">
                  Disconnect
                </button>
              </>
            ) : (
              <button onClick={connectWallet} disabled={isConnecting} className="btn-primary">
                {isConnecting ? "Connecting…" : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
