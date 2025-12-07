// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import { AbstractProxy } from './AbstractProxy.sol';

contract Proxy is AbstractProxy {
    bytes32 private constant SLOT_PROXY_STORAGE = keccak256(abi.encodePacked('dao.slot.proxy.storage'));

    struct Data {
        address admin;
        address implementation;
    }

    event ImplementationUpgraded(address indexed _implementation);
    event AdminChanged(address indexed _previousAdmin, address indexed _newAdmin);

    constructor() {
        load().admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == _admin(), 'Proxy: Not admin');
        _;
    }

    function upgradeAndCall(address _newImplementation, bytes calldata _data) onlyAdmin external payable returns (bool success) {
        success = _setImplementation(_newImplementation);

        if (_data.length > 0) {
            (success, ) = _newImplementation.delegatecall(_data);
            require(success, 'Proxy: UpgradeAndCall failed');
        } else {
            require(msg.value == 0, 'Proxy: Value must be 0');
        }
    }

    function setImplementation(address _newImplementation) onlyAdmin external returns (bool) {
        return _setImplementation(_newImplementation);
    }

    function changeAdmin(address _newAdmin) onlyAdmin external returns (bool) {
        require(_newAdmin != address(0), 'Proxy: Invalid admin');

        emit AdminChanged(_admin(), _newAdmin);
        load().admin = _newAdmin;
        return true;
    }

    function getImplementation() external view returns (address) {
        return _implementation();
    }

    function getAdmin() external view returns (address) {
        return _admin();
    }

    function _setImplementation(address _newImplementation) internal returns (bool) {
        require(_newImplementation.code.length > 0, 'Proxy: Invalid implementation');

        emit ImplementationUpgraded(_newImplementation);
        load().implementation = _newImplementation;
        return true;
    }

    function _implementation() internal view override returns (address) {
        return load().implementation;
    }

    function _admin() internal view returns (address) {
        return load().admin;
    }

    function load() internal pure returns (Data storage data) {
        bytes32 slot = SLOT_PROXY_STORAGE;

        assembly {
            data.slot := slot
        }
    }

}