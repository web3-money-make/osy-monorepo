// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IStUSD.sol";
import "./interfaces/IComet.sol";
import "./interfaces/IBridge.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title OmniVault
 * @notice Main chain vault for deposit/withdraw and interest distribution
 */
contract OmniVault is Ownable, Initializable {
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 public constant ETH_SEPOLIA = 11155111;
    uint256 public constant BASE_SEPOLIA = 84532;
    uint256 public constant INSECTARIUM = 43522;

    uint256 public constant MIN_SUPPLY = 2 * 10 **6;

    IERC20 public USDC;
    IStUSD public osyUSD;

    IComet public comet;
    IBridge public bridge;

    EnumerableSet.AddressSet private admins;

    uint256 private totalSupplies;
    mapping(uint256 chainId => uint256 totalSupplies) private totalSuppliesEachChain;
    mapping(uint256 chainId => uint256 supplyRate) private supplyRateEachChain;
    mapping(uint256 chainId => uint256 updateTimestamp) private updateTimestampEachChain;

    mapping(uint256 chainId => uint256 APR) private APREachChain;

    constructor() Ownable(msg.sender) {}

    event UpdatedInterest(uint256 indexed chainId, uint256 oldSupply, uint256 newSupply, uint256 oldAPR, uint256 newAPR);
    event InterestApplied(uint256 totalSupply);
    event InterestFailed(uint256 totalSupply);
    event Rebalanced(uint256 indexed srcChainId, uint256 indexed dstChainId, uint256 amount);

    function initialize() external initializer {
        require(owner() == address(0), "OmniVault: Already initialized");
        _transferOwnership(msg.sender);
    }

    function setUSDC(address _USDC) external onlyOwner {
        USDC = IERC20(_USDC);
    }

    function approveUSDC() external onlyOwner {
        USDC.approve(address(bridge), type(uint256).max);

        if (address(comet) != address(0)) {
            USDC.approve(address(comet), type(uint256).max);
        }
    }

    function setOSYUSD(address _osyUSD) external onlyOwner {
        osyUSD = IStUSD(_osyUSD);
    }

    function setBridge(address _bridge) external onlyOwner {
        bridge = IBridge(_bridge);
    }

    function setComet(address _comet) external onlyOwner {
        comet = IComet(_comet);
    }

    function addAdmin(address _admin) external onlyOwner {
        admins.add(_admin);
    }

    function removeAdmin(address _admin) external onlyOwner {
        admins.remove(_admin);
    }

    function deposit(uint256 _amount) external {
        require(block.chainid == INSECTARIUM, "OmniVault: only on Insectarium");
        USDC.transferFrom(msg.sender, address(this), _amount);
        osyUSD.mint(msg.sender, _amount);

        uint256 chainId;

        if (totalSuppliesEachChain[ETH_SEPOLIA] < MIN_SUPPLY) {
            chainId = ETH_SEPOLIA;
        } else if (totalSuppliesEachChain[BASE_SEPOLIA] < MIN_SUPPLY) {
            chainId = BASE_SEPOLIA;
        } else {
            chainId = APREachChain[ETH_SEPOLIA] < APREachChain[BASE_SEPOLIA] * totalSuppliesEachChain[BASE_SEPOLIA] ? BASE_SEPOLIA : ETH_SEPOLIA;
        }

        bridge.bridge(
            _amount,
            address(this),
            chainId,
            abi.encodeWithSelector(this.crossDeposit.selector, _amount)
        );
    }

    function crossDeposit(uint256 _amount) external {
        require(block.chainid == BASE_SEPOLIA || block.chainid == ETH_SEPOLIA, "OmniVault: only on Eth Sepolia or Base Sepolia");
        require(address(bridge) == msg.sender, "OmniVault: not a bridge");
        
        comet.supply(address(USDC), _amount);
    }

    function withdraw(uint256 _amount) external {
        require(block.chainid == INSECTARIUM, "OmniVault: only on Insectarium");
        require(osyUSD.balanceOf(msg.sender) >= _amount, "OmniVault: insufficient balance");
        osyUSD.burnFrom(msg.sender, _amount);

        uint256 _chainId = totalSuppliesEachChain[ETH_SEPOLIA] > totalSuppliesEachChain[BASE_SEPOLIA] ? ETH_SEPOLIA : BASE_SEPOLIA;

        bridge.bridge(
            0,
            address(this),
            _chainId,
            abi.encodeWithSelector(this.crossWithdraw.selector, msg.sender, _amount)
        );
    }

    function crossWithdraw(address _recipient, uint256 _amount) external {
        require(block.chainid == BASE_SEPOLIA || block.chainid == ETH_SEPOLIA, "OmniVault: only on Eth Sepolia or Base Sepolia");
        require(address(bridge) == msg.sender, "OmniVault: not a bridge");
        comet.withdraw(address(USDC), _amount);

        bridge.bridge(
            _amount,
            _recipient,
            INSECTARIUM,
            bytes("")
        );
    }

    function requestInterest(bool _onlySupply) external {
        require(admins.contains(msg.sender), "OmniVault: not an admin");
        require(block.chainid == INSECTARIUM, "OmniVault: only on Insectarium");

        bridge.bridge(
            0,
            address(this),
            ETH_SEPOLIA,
            abi.encodeWithSelector(this.respondInterest.selector, _onlySupply)
        );

        bridge.bridge(
            0,
            address(this),
            BASE_SEPOLIA,
            abi.encodeWithSelector(this.respondInterest.selector, _onlySupply)
        );
    }

    function respondInterest(bool _onlySupply) external {
        require(block.chainid == ETH_SEPOLIA || block.chainid == BASE_SEPOLIA, "OmniVault: only on Eth Sepolia or Base Sepolia");
        require(address(bridge) == msg.sender, "OmniVault: not a bridge");

        uint256 supplies = comet.balanceOf(address(this));
        uint256 utilization = comet.getUtilization();
        uint256 supplyRate = comet.getSupplyRate(utilization);

        bridge.bridge(
            0,
            address(this),
            INSECTARIUM,
            abi.encodeWithSelector(this.updateInterest.selector, block.chainid, supplies, supplyRate, _onlySupply)
        );
    }

    function updateInterest(uint256 _chainId, uint256 _supplies, uint256 _supplyRate, bool _onlySupply) external {
        require(block.chainid == INSECTARIUM, "OmniVault: only on Insectarium");
        require(address(bridge) == msg.sender, "OmniVault: not a bridge");

        uint256 oldSupply = totalSuppliesEachChain[_chainId];
        uint256 oldAPR = APREachChain[_chainId];

        totalSuppliesEachChain[_chainId] = _supplies;
        updateTimestampEachChain[_chainId] = block.timestamp;

        if (!_onlySupply) {
            supplyRateEachChain[_chainId] = _supplyRate;
            APREachChain[_chainId] = _supplyRate * 365 days;
            emit UpdatedInterest(_chainId, oldSupply, _supplies, oldAPR, _supplyRate * 365 days);
        }

        if (_chainId == ETH_SEPOLIA) {
            totalSupplies = totalSuppliesEachChain[ETH_SEPOLIA] + totalSuppliesEachChain[BASE_SEPOLIA];
            try osyUSD.applyInterest(totalSupplies) {
                emit InterestApplied(totalSupplies);
            } catch {
                emit InterestFailed(totalSupplies);
            }
        }
    }

    function updateAPR(uint256 _chainId, uint256 _APR) external {
        require(block.chainid == INSECTARIUM, "OmniVault: only on Insectarium");
        require(admins.contains(msg.sender), "OmniVault: not an admin");

        require(_chainId == ETH_SEPOLIA || _chainId == BASE_SEPOLIA, "OmniVault: only on Eth Sepolia or Base Sepolia");

        emit UpdatedInterest(_chainId, totalSuppliesEachChain[_chainId], totalSuppliesEachChain[_chainId], APREachChain[_chainId], _APR);
        APREachChain[_chainId] = _APR;
    }

    function getEachSupply(uint256 _chainId) external view returns (uint256) {
        return totalSuppliesEachChain[_chainId];
    }

    function getTotalSupply() external view returns (uint256) {
        return totalSupplies;
    }

    function getEachAPR(uint256 _chainId) external view returns (uint256) {
        return APREachChain[_chainId];
    }

    function getAPR() external view returns (uint256) {
        return ((APREachChain[ETH_SEPOLIA] * totalSuppliesEachChain[ETH_SEPOLIA] ) + (APREachChain[BASE_SEPOLIA] * totalSuppliesEachChain[BASE_SEPOLIA])) / totalSupplies;
    }

    function rebalance() external {
        require(admins.contains(msg.sender), "OmniVault: not an admin");
        require(block.chainid == INSECTARIUM, "OmniVault: only on Insectarium");

        uint256 ethSupply = totalSuppliesEachChain[ETH_SEPOLIA];
        uint256 baseSupply = totalSuppliesEachChain[BASE_SEPOLIA];
        uint256 ethAPR = APREachChain[ETH_SEPOLIA];
        uint256 baseAPR = APREachChain[BASE_SEPOLIA];

        uint256 amountToMove;

        if (ethAPR > baseAPR) {
            if (baseSupply > MIN_SUPPLY) {
                amountToMove = (baseSupply - MIN_SUPPLY) / 2;
                bridge.bridge(
                    0,
                    address(this),
                    BASE_SEPOLIA,
                    abi.encodeWithSelector(this.crossRebalance.selector, ETH_SEPOLIA, amountToMove)
                );

                emit Rebalanced(BASE_SEPOLIA, ETH_SEPOLIA, amountToMove);
            }
        } else if (baseAPR > ethAPR) {
            if (ethSupply > MIN_SUPPLY) {
                amountToMove = (ethSupply - MIN_SUPPLY) / 2;
                bridge.bridge(
                    0,
                    address(this),
                    ETH_SEPOLIA,
                    abi.encodeWithSelector(this.crossRebalance.selector, BASE_SEPOLIA, amountToMove)
                );

                emit Rebalanced(ETH_SEPOLIA, BASE_SEPOLIA, amountToMove);
            }
        }
    }

    function crossRebalance(uint256 _targetChainId, uint256 _amount) external {
        require(block.chainid == BASE_SEPOLIA || block.chainid == ETH_SEPOLIA, "OmniVault: only on Eth Sepolia or Base Sepolia");
        require(address(bridge) == msg.sender, "OmniVault: not a bridge");

        comet.withdraw(address(USDC), _amount);

        bridge.bridge(
            _amount,
            address(this),
            _targetChainId,
            abi.encodeWithSelector(this.crossDeposit.selector, _amount)
        );
    }
}
