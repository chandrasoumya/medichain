const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying EHRSystem contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`📋 Deploying with account: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${hre.ethers.formatEther(balance)} ETH`);

  const EHRSystem = await hre.ethers.getContractFactory("EHRSystem");
  const ehr = await EHRSystem.deploy();
  await ehr.waitForDeployment();

  const contractAddress = await ehr.getAddress();
  console.log(`✅ EHRSystem deployed to: ${contractAddress}`);

  // Save deployment info for the frontend
  const deploymentInfo = {
    contractAddress,
    deployer: deployer.address,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployedAt: new Date().toISOString(),
  };

  // Write to root deployment file
  fs.writeFileSync(
    path.join(__dirname, "../deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Also copy ABI + address to frontend
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/EHRSystem.sol/EHRSystem.json"
  );

  const frontendContractsDir = path.join(
    __dirname,
    "../frontend/src/contracts"
  );

  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Write ABI
  fs.writeFileSync(
    path.join(frontendContractsDir, "EHRSystem.json"),
    JSON.stringify({ abi: artifact.abi, address: contractAddress }, null, 2)
  );

  console.log(`📁 Contract ABI + address saved to frontend/src/contracts/`);
  console.log(`\n🎉 Deployment complete!`);
  console.log(`   Network : ${hre.network.name}`);
  console.log(`   Address : ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
