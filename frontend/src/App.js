import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./context/Web3Context";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import PatientPage from "./pages/PatientPage";
import DoctorPage from "./pages/DoctorPage";
import AdminPage from "./pages/AdminPage";
import RecordsPage from "./pages/RecordsPage";

function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patient" element={<PatientPage />} />
              <Route path="/doctor" element={<DoctorPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/records" element={<RecordsPage />} />
            </Routes>
          </main>
          <footer className="border-t border-slate-200 mt-16 py-6 text-center text-xs text-slate-400">
            MediChain — Blockchain EHR · Built on Ethereum · IPFS Storage · Solidity Smart Contracts
          </footer>
        </div>
      </BrowserRouter>
    </Web3Provider>
  );
}

export default App;
