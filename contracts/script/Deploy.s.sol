// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/EventTreasury.sol";
import "../src/CheckInAttestation.sol";
import "../src/MockUSDC.sol";

contract DeployScript is Script {
    function run() external {
        // Read configuration from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address adminAddress = vm.envAddress("ADMIN_ADDRESS");
        address agentAddress = vm.envAddress("AGENT_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MockUSDC
        MockUSDC mockUSDC = new MockUSDC();
        address usdcAddress = address(mockUSDC);
        console.log("MockUSDC deployed at:", usdcAddress);

        // 2. Deploy CheckInAttestation with the deployer as temporary owner
        address deployer = vm.addr(deployerPrivateKey);
        CheckInAttestation attestation = new CheckInAttestation(deployer);
        console.log("CheckInAttestation deployed at:", address(attestation));

        // 3. Deploy EventTreasury
        EventTreasury treasury = new EventTreasury(
            usdcAddress,
            address(attestation),
            adminAddress,
            agentAddress
        );
        console.log("EventTreasury deployed at:", address(treasury));

        // 3. Set Agent Address on the Attestation contract
        attestation.setAgentAddress(agentAddress);
        console.log("Agent address set on Attestation:", agentAddress);

        // 4. Transfer ownership of Attestation to the Treasury contract
        attestation.transferOwnership(address(treasury));
        console.log("Attestation ownership transferred to EventTreasury");

        vm.stopBroadcast();
    }
}
