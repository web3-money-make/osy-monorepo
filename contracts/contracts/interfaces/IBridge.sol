// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBridge
 * @notice Interface for the Bridge contract
 */
interface IBridge {
    struct BridgeRequest {
        uint256 sourceChainId;
        uint256 destinationChainId;
        address sender;
        uint256 amount;
        address recipient;
        bytes data;
    }

    event BridgeRequested(bytes32 indexed requestHash, address sender, address recipient, uint256 chainId, uint256 amount, bytes data);
    event BridgeRelayed(bytes32 indexed requestHash, address sender, address recipient, uint256 chainId, uint256 amount, bytes data);
    event BridgeExecuted(bytes32 indexed requestHash, address sender, address recipient, uint256 chainId, uint256 amount, bytes data);
    event BridgeFailed(bytes32 indexed requestHash, address sender, address recipient, uint256 chainId, uint256 amount, bytes data);

    /**
     * @notice Initiate a cross-chain bridge transfer
     * @param _amount Amount of USDC to bridge
     * @param _recipient Recipient address on destination chain
     * @param _chainId Destination chain ID
     * @param _data Additional data to pass with the bridge (e.g., function call data)
     */
    function bridge(uint256 _amount, address _recipient, uint256 _chainId, bytes calldata _data) external;

    /**
     * @notice Relay a bridge request on the destination chain
     * @param _bridgeRequest The bridge request details
     * @param _signature Relayer's signature
     */
    function relay(BridgeRequest calldata _bridgeRequest, bytes calldata _signature) external;

    /**
     * @notice Set USDC token address (only owner)
     * @param _USDC USDC token address
     */
    function setUSDC(address _USDC) external;

    /**
     * @notice Add a relayer (only owner)
     * @param _relayer Relayer address to add
     */
    function addRelayer(address _relayer) external;

    /**
     * @notice Remove a relayer (only owner)
     * @param _relayer Relayer address to remove
     */
    function removeRelayer(address _relayer) external;

    /**
     * @notice Get the number of relayers
     * @return Number of relayers
     */
    function getRelayersCount() external view returns (uint256);

    /**
     * @notice Get relayer address at index
     * @param _index Index of the relayer
     * @return Relayer address
     */
    function getRelayers(uint256 _index) external view returns (address);

    /**
     * @notice Get USDC token address
     * @return USDC token address
     */
    function USDC() external view returns (address);

    /**
     * @notice Check if a bridge request has been executed
     * @param requestHash Hash of the bridge request
     * @return True if executed, false otherwise
     */
    function executedRequests(bytes32 requestHash) external view returns (bool);
}
