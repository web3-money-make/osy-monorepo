// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Bridge is Ownable, Initializable, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IERC20 public USDC;
    EnumerableSet.AddressSet private relayers;
    mapping(bytes32 => bool) public executedRequests;
    mapping(uint256 chainId => mapping(address => uint256)) public sendNonces;
    mapping(uint256 chainId => mapping(address => uint256)) public receiveNonces;

    constructor() Ownable(msg.sender) {}

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

    function initialize() external initializer {
        require(owner() == address(0), "Bridge: Already initialized");
        _transferOwnership(msg.sender);
    }

    function setUSDC(address _USDC) external onlyOwner {
        USDC = IERC20(_USDC);
    }

    function addRelayer(address _relayer) external onlyOwner {
        relayers.add(_relayer);
    }

    function removeRelayer(address _relayer) external onlyOwner {
        relayers.remove(_relayer);
    }

    function bridge(uint256 _amount, address _recipient, uint256 _chainId, bytes calldata _data) external {
        USDC.transferFrom(msg.sender, address(this), _amount);

        BridgeRequest memory bridgeRequest = BridgeRequest({
            sourceChainId: block.chainid,
            destinationChainId: _chainId,
            sender: msg.sender,
            amount: _amount,
            recipient: _recipient,
            data: _data
        });

        bytes32 requestHash = keccak256(abi.encode(bridgeRequest, sendNonces[_chainId][msg.sender]));

        sendNonces[_chainId][msg.sender]++;

        emit BridgeRequested(requestHash, msg.sender, _recipient, _chainId, _amount, _data);
    }

    function relay(BridgeRequest calldata _bridgeRequest, bytes calldata _signature) external nonReentrant {
        require(_bridgeRequest.destinationChainId == block.chainid, "Bridge: Invalid chainId");

        bytes32 requestHash = keccak256(abi.encode(_bridgeRequest, receiveNonces[_bridgeRequest.sourceChainId][_bridgeRequest.sender]));
        receiveNonces[_bridgeRequest.sourceChainId][_bridgeRequest.sender]++;

        require(!executedRequests[requestHash], "Bridge: Request already executed");
        
        bytes32 ethSignedHash = requestHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(_signature);
        
        require(relayers.contains(signer), "Bridge: Invalid relayer signature");
        
        executedRequests[requestHash] = true;
        USDC.transfer(_bridgeRequest.recipient, _bridgeRequest.amount);

        emit BridgeRelayed(requestHash, _bridgeRequest.sender, _bridgeRequest.recipient, _bridgeRequest.destinationChainId, _bridgeRequest.amount, _bridgeRequest.data);

        bool success = true;

        if (_bridgeRequest.data.length > 0) {
            (success, ) = _bridgeRequest.recipient.call{gas: 3000000}(_bridgeRequest.data);
        }

        if (success) {
            emit BridgeExecuted(requestHash, _bridgeRequest.sender, _bridgeRequest.recipient, _bridgeRequest.destinationChainId, _bridgeRequest.amount, _bridgeRequest.data);
        } else {
            emit BridgeFailed(requestHash, _bridgeRequest.sender, _bridgeRequest.recipient, _bridgeRequest.destinationChainId, _bridgeRequest.amount, _bridgeRequest.data);
        }
    }

    function getRelayersCount() external view returns (uint256) {
        return relayers.length();
    }

    function getRelayers(uint256 _index) external view returns (address) {
        return relayers.at(_index);
    }
}