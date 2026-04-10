# MediChain — Blockchain EHR System

A secure, patient-centric Electronic Health Records system built on Ethereum with IPFS off-chain storage.

---

## 🏗️ Project Structure

```
ehr-blockchain/
├── contracts/
│   └── EHRSystem.sol          # Solidity smart contract
├── scripts/
│   └── deploy.js              # Hardhat deployment script
├── test/
│   └── EHRSystem.test.js      # Comprehensive test suite
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js
│       ├── index.js
│       ├── index.css          # Tailwind CSS
│       ├── context/
│       │   └── Web3Context.js # Wallet + contract state
│       ├── pages/
│       │   ├── Dashboard.js
│       │   ├── PatientPage.js
│       │   ├── DoctorPage.js
│       │   ├── AdminPage.js
│       │   └── RecordsPage.js
│       ├── utils/
│       │   ├── ipfs.js        # Pinata IPFS helpers
│       │   └── helpers.js     # Formatters, constants
│       └── contracts/
│           └── EHRSystem.json # Auto-generated after deploy
├── hardhat.config.js
├── package.json
├── .env                       # Root env (Hardhat)
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MetaMask browser extension
- Alchemy account (free) → [alchemy.com](https://alchemy.com)
- Pinata account (free) → [pinata.cloud](https://pinata.cloud) *(optional, for real IPFS uploads)*

---

### Step 1 — Install Root Dependencies (Hardhat)

```bash
npm install
```

### Step 2 — Compile the Contract

```bash
npm run compile
```

### Step 3 — Run Tests

```bash
npm test
```

---

### Step 4 — Deploy

#### Option A: Local Hardhat Network (Free, no wallet needed)

Terminal 1 — start local node:
```bash
npm run node
```

Terminal 2 — deploy:
```bash
npm run deploy:local
```

#### Option B: Sepolia Testnet

1. Get test ETH from [sepoliafaucet.com](https://sepoliafaucet.com) or [alchemy.com/faucets/ethereum-sepolia](https://www.alchemy.com/faucets/ethereum-sepolia)
2. Confirm `.env` has your keys:
   ```
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   PRIVATE_KEY=0xyour_private_key
   ```
3. Deploy:
   ```bash
   npm run deploy:sepolia
   ```

After deployment, `frontend/src/contracts/EHRSystem.json` is automatically updated with the contract address and ABI.

---

### Step 5 — Configure Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```
REACT_APP_PINATA_JWT=your_pinata_jwt_token
REACT_APP_CONTRACT_ADDRESS=   # auto-filled by deploy script
REACT_APP_CHAIN_ID=11155111   # 31337 for localhost
```

**Getting your Pinata JWT:**
1. Go to [app.pinata.cloud](https://app.pinata.cloud) → API Keys
2. Generate a new key with `pinFileToIPFS` and `pinJSONToIPFS` permissions
3. Copy the JWT

---

### Step 6 — Start Frontend

```bash
cd frontend
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔧 Usage Flow

### As Admin (contract deployer)
1. Connect MetaMask (same wallet used to deploy)
2. Go to **Admin** panel
3. Add doctor wallets using **Register New Doctor**

### As Patient
1. Connect MetaMask
2. Go to **My Records**
3. Click **Register Now** to register on-chain
4. Use **Grant Access** to allow doctors to view your records
5. Upload files or notes to add records

### As Doctor
1. Connect MetaMask (must be added by admin first)
2. Go to **Doctor Panel**
3. Enter a patient address and click **Load Records**
4. Add clinical records for the patient

---

## 🌐 Deployment (Production)

### Frontend → Vercel

```bash
cd frontend
npm run build
```

Then push to GitHub and connect to [vercel.com](https://vercel.com). Set environment variables in the Vercel dashboard.

### Smart Contract → Sepolia (already covered above)

---

## 🔒 Security Features

| Feature | Implementation |
|---------|---------------|
| Reentrancy Guard | Custom `locked` mutex modifier |
| Zero-Address Check | `validAddress` modifier on all address inputs |
| Input Validation | `nonEmptyString` modifier for IPFS hashes |
| Role-Based Access | Explicit doctor/patient/admin checks |
| Patient-Controlled Access | `grantAccess` / `revokeAccess` functions |
| Immutable Audit Trail | All actions emit on-chain events |

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity 0.8.19 |
| Blockchain | Ethereum (Sepolia Testnet) |
| Dev Environment | Hardhat |
| Off-chain Storage | IPFS via Pinata |
| Frontend | React 18 + React Router 6 |
| Styling | Tailwind CSS 3 |
| Web3 | Ethers.js v6 |
| Notifications | React Toastify |

---

## 📄 Contract Functions Reference

| Function | Role | Description |
|----------|------|-------------|
| `registerPatient()` | Anyone | Register caller as patient |
| `addDoctor(addr)` | Admin | Register a doctor wallet |
| `removeDoctor(addr)` | Admin | Deactivate a doctor |
| `grantAccess(doctor)` | Patient | Allow doctor to view/add records |
| `revokeAccess(doctor)` | Patient | Remove doctor's permission |
| `addRecord(patient, hash, type)` | Patient/Doctor | Store IPFS hash on-chain |
| `getPatientRecords(patient)` | Patient/Auth Doctor | Retrieve all records |
| `isPatientRegistered(addr)` | Anyone | Check registration status |
| `isDoctorValid(addr)` | Anyone | Check doctor status |
| `isAuthorized(patient, doctor)` | Anyone | Check access grant |

---

## ⚠️ Important Notes

- **Never commit your `.env` file** or expose your private key
- The provided private key in `.env` is for **testnet/demo use only**
- For production, use a hardware wallet or secure key management
- IPFS uploads without Pinata will use demo hashes (for local testing)
