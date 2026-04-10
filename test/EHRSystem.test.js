const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EHRSystem", function () {
  let ehr;
  let admin, patient1, patient2, doctor1, doctor2, stranger;

  beforeEach(async function () {
    [admin, patient1, patient2, doctor1, doctor2, stranger] =
      await ethers.getSigners();

    const EHRSystem = await ethers.getContractFactory("EHRSystem");
    ehr = await EHRSystem.deploy();
    await ehr.waitForDeployment();
  });

  // ─── DEPLOYMENT ───────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      expect(await ehr.admin()).to.equal(admin.address);
    });
  });

  // ─── PATIENT REGISTRATION ─────────────────────────────────────────────────

  describe("Patient Registration", function () {
    it("Should register a patient", async function () {
      const tx = await ehr.connect(patient1).registerPatient();
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(ehr, "PatientRegistered")
        .withArgs(patient1.address, block.timestamp);

      expect(await ehr.isPatientRegistered(patient1.address)).to.equal(true);
    });

    it("Should revert if patient registers twice", async function () {
      await ehr.connect(patient1).registerPatient();
      await expect(
        ehr.connect(patient1).registerPatient()
      ).to.be.revertedWith("Patient already registered");
    });
  });

  // ─── DOCTOR MANAGEMENT ────────────────────────────────────────────────────

  describe("Doctor Management", function () {
    it("Admin can add a doctor", async function () {
      const tx = await ehr.connect(admin).addDoctor(doctor1.address);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(ehr, "DoctorAdded")
        .withArgs(doctor1.address, block.timestamp);

      expect(await ehr.isDoctorValid(doctor1.address)).to.equal(true);
    });

    it("Admin can remove a doctor", async function () {
      await ehr.connect(admin).addDoctor(doctor1.address);
      const tx = await ehr.connect(admin).removeDoctor(doctor1.address);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(ehr, "DoctorRemoved")
        .withArgs(doctor1.address, block.timestamp);

      expect(await ehr.isDoctorValid(doctor1.address)).to.equal(false);
    });

    it("Non-admin cannot add a doctor", async function () {
      await expect(
        ehr.connect(stranger).addDoctor(doctor1.address)
      ).to.be.revertedWith("Caller is not the admin");
    });

    it("Should revert on zero-address", async function () {
      await expect(
        ehr.connect(admin).addDoctor(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address: Zero address detected");
    });
  });

  // ─── ACCESS CONTROL ───────────────────────────────────────────────────────

  describe("Access Control", function () {
    beforeEach(async function () {
      await ehr.connect(patient1).registerPatient();
      await ehr.connect(admin).addDoctor(doctor1.address);
    });

    it("Patient can grant access to a doctor", async function () {
      const tx = await ehr.connect(patient1).grantAccess(doctor1.address);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(ehr, "AccessGranted")
        .withArgs(patient1.address, doctor1.address, block.timestamp);

      expect(
        await ehr.isAuthorized(patient1.address, doctor1.address)
      ).to.equal(true);
    });

    it("Patient can revoke access", async function () {
      await ehr.connect(patient1).grantAccess(doctor1.address);
      const tx = await ehr.connect(patient1).revokeAccess(doctor1.address);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(ehr, "AccessRevoked")
        .withArgs(patient1.address, doctor1.address, block.timestamp);

      expect(
        await ehr.isAuthorized(patient1.address, doctor1.address)
      ).to.equal(false);
    });

    it("Should revert granting access to non-doctor", async function () {
      await expect(
        ehr.connect(patient1).grantAccess(stranger.address)
      ).to.be.revertedWith("Provider is not a valid registered doctor");
    });

    it("Unregistered patient cannot grant access", async function () {
      await expect(
        ehr.connect(patient2).grantAccess(doctor1.address)
      ).to.be.revertedWith("Patient is not registered");
    });
  });

  // ─── RECORD MANAGEMENT ────────────────────────────────────────────────────

  describe("Record Management", function () {
    const IPFS_HASH = "QmTestHashABC123";
    const RECORD_TYPE = "Blood Test";

    beforeEach(async function () {
      await ehr.connect(patient1).registerPatient();
      await ehr.connect(admin).addDoctor(doctor1.address);
      await ehr.connect(patient1).grantAccess(doctor1.address);
    });

    it("Patient can add their own record", async function () {
      await expect(
        ehr.connect(patient1).addRecord(patient1.address, IPFS_HASH, RECORD_TYPE)
      ).to.emit(ehr, "RecordAdded");

      expect(await ehr.getRecordCount(patient1.address)).to.equal(1);
    });

    it("Authorized doctor can add a record", async function () {
      await expect(
        ehr.connect(doctor1).addRecord(patient1.address, IPFS_HASH, RECORD_TYPE)
      ).to.emit(ehr, "RecordAdded");
    });

    it("Unauthorized doctor cannot add a record", async function () {
      await ehr.connect(admin).addDoctor(doctor2.address);
      await expect(
        ehr.connect(doctor2).addRecord(patient1.address, IPFS_HASH, RECORD_TYPE)
      ).to.be.revertedWith("Doctor not authorized by patient");
    });

    it("Stranger cannot add a record", async function () {
      await expect(
        ehr.connect(stranger).addRecord(patient1.address, IPFS_HASH, RECORD_TYPE)
      ).to.be.revertedWith("Caller is not a valid doctor");
    });

    it("Should revert on empty IPFS hash", async function () {
      await expect(
        ehr.connect(patient1).addRecord(patient1.address, "", RECORD_TYPE)
      ).to.be.revertedWith("Invalid input: String cannot be empty");
    });
  });

  // ─── VIEW FUNCTIONS ───────────────────────────────────────────────────────

  describe("View Functions", function () {
    beforeEach(async function () {
      await ehr.connect(patient1).registerPatient();
      await ehr.connect(admin).addDoctor(doctor1.address);
      await ehr.connect(patient1).grantAccess(doctor1.address);
      await ehr
        .connect(patient1)
        .addRecord(patient1.address, "QmHash1", "X-Ray");
      await ehr
        .connect(doctor1)
        .addRecord(patient1.address, "QmHash2", "MRI");
    });

    it("Patient can read their own records", async function () {
      const [hashes, types, authors] = await ehr
        .connect(patient1)
        .getPatientRecords(patient1.address);

      expect(hashes.length).to.equal(2);
      expect(hashes[0]).to.equal("QmHash1");
      expect(types[1]).to.equal("MRI");
      expect(authors[1]).to.equal(doctor1.address);
    });

    it("Authorized doctor can read records", async function () {
      const [hashes] = await ehr
        .connect(doctor1)
        .getPatientRecords(patient1.address);
      expect(hashes.length).to.equal(2);
    });

    it("Unauthorized user cannot read records", async function () {
      await expect(
        ehr.connect(stranger).getPatientRecords(patient1.address)
      ).to.be.revertedWith("Access Denied: Permission required");
    });
  });
});