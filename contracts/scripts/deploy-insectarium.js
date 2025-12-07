const hre = require("hardhat");
const fs = require("fs");

const deployments = JSON.parse(fs.readFileSync("./deployments.json", "utf8"));
const compound = JSON.parse(fs.readFileSync("./compound.json", "utf8"));
const usdc = JSON.parse(fs.readFileSync("./usdc.json", "utf8"));

async function main() {
  const [deployer, relayer] = await hre.ethers.getSigners();

  console.log("\nDeploying contracts with the account:", deployer.address);
  console.log("Relayer address:", relayer.address);
  console.log("Network:", hre.network.name);
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  console.log("Chain ID:", chainId, "\n");

  console.log("Deployments:", deployments[chainId]);
  console.log("Compound:", compound[chainId]);
  console.log("USDC:", usdc[chainId], "\n");

  // 1. Deploy Proxy
  const Proxy = await hre.ethers.getContractFactory("Proxy");

  const bridgeProxy = await Proxy.deploy();
  await bridgeProxy.waitForDeployment();
  const bridgeProxyAddress = await bridgeProxy.getAddress();
  console.log("BridgeProxy deployed to:", bridgeProxyAddress);

  const omniVaultProxy = await Proxy.deploy();
  await omniVaultProxy.waitForDeployment();
  const omniVaultProxyAddress = await omniVaultProxy.getAddress();
  console.log("OmniVaultProxy deployed to:", omniVaultProxyAddress);

  // 2. Deploy MockUSDC
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // 3. Deploy Bridge
  const Bridge = await hre.ethers.getContractFactory("Bridge");
  const bridge = await Bridge.deploy();
  await bridge.waitForDeployment();
  const bridgeAddress = await bridge.getAddress();
  console.log("Bridge deployed to:", bridgeAddress);


  // 4. Deploy OmniVault
  const OmniVault = await hre.ethers.getContractFactory("OmniVault");
  const omniVault = await OmniVault.deploy();
  await omniVault.waitForDeployment();
  const omniVaultAddress = await omniVault.getAddress();
  console.log("OmniVault deployed to:", omniVaultAddress, "\n");

  // 5. set proxy
  await bridgeProxy.upgradeAndCall(bridgeAddress, bridge.interface.encodeFunctionData("initialize"));
  console.log("Bridge initialized");
  await omniVaultProxy.upgradeAndCall(omniVaultAddress, omniVault.interface.encodeFunctionData("initialize"));
  console.log("OmniVault initialized");

  const bridgeInstance = Bridge.attach(bridgeProxyAddress);
  const omniVaultInstance = OmniVault.attach(omniVaultProxyAddress);

  // 6. set bridge
  await bridgeInstance.setUSDC(usdcAddress);
  console.log("USDC set in Bridge");
  await bridgeInstance.addRelayer(relayer.address);
  console.log("Relayer added to Bridge");

  // 7. set omni vault (osyUSD is after)
  await omniVaultInstance.setUSDC(usdcAddress);
  console.log("USDC set in OmniVault");
  await omniVaultInstance.setBridge(bridgeProxyAddress);
  console.log("Bridge set in OmniVault");
  await omniVaultInstance.addAdmin(deployer.address);
  console.log("Admin added to OmniVault");
  await omniVaultInstance.approveUSDC();
  console.log("USDC approved in OmniVault\n");

  // Summary
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);
  console.log("\nContract Addresses:");
  console.log("MockUSDC:", usdcAddress);
  console.log("Bridge:", bridgeAddress);
  console.log("BridgeProxy:", bridgeProxyAddress);
  console.log("OmniVault:", omniVaultAddress);
  console.log("OmniVaultProxy:", omniVaultProxyAddress);
  console.log("\nAccounts:");
  console.log("Deployer:", deployer.address);
  console.log("Relayer:", relayer.address);
  console.log("\n✅ Deployment completed successfully!");

  deployments[chainId] = {
    USDC: usdcAddress,
    Bridge: bridgeAddress,
    BridgeProxy: bridgeProxyAddress,
    OmniVault: omniVaultAddress,
    OmniVaultProxy: omniVaultProxyAddress
  };
  fs.writeFileSync("./deployments.json", JSON.stringify(deployments, null, 2));

  console.log("Deployments saved to:", "./deployments.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
