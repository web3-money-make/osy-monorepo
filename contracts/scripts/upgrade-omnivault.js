const hre = require("hardhat");
const fs = require("fs");

const deployments = JSON.parse(fs.readFileSync("./deployments.json", "utf8"));

async function main() {
  const [deployer, relayer] = await hre.ethers.getSigners();

  console.log("\nDeploying contracts with the account:", deployer.address);
  console.log("Relayer address:", relayer.address);
  console.log("Network:", hre.network.name);
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  console.log("Chain ID:", chainId, "\n");

  console.log("Deployments:", deployments[chainId]);

  // 1. Deploy Proxy
  const Proxy = await hre.ethers.getContractFactory("Proxy");



  // 4. Deploy OmniVault
  const OmniVault = await hre.ethers.getContractFactory("OmniVault");
  const omniVault = await OmniVault.deploy();
  await omniVault.waitForDeployment();
  const omniVaultAddress = await omniVault.getAddress();
  console.log("OmniVault deployed to:", omniVaultAddress, "\n");

  const proxy = Proxy.attach(deployments[chainId].OmniVaultProxy);
  await proxy.setImplementation(omniVaultAddress);
  console.log("OmniVaultProxy set to:", omniVaultAddress);


  // Summary
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);
  console.log("OmniVault:", omniVaultAddress);
  console.log("\nAccounts:");
  console.log("Deployer:", deployer.address);
  console.log("Relayer:", relayer.address);
  console.log("\n✅ Deployment completed successfully!");

  deployments[chainId]['OmniVault'] = omniVaultAddress;
  fs.writeFileSync("./deployments.json", JSON.stringify(deployments, null, 2));

  console.log("Deployments saved to:", "./deployments.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
