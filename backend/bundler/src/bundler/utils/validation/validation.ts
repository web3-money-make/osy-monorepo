import { BytesLike, Contract, hexlify, toBeHex } from 'ethers';

import { ZERO_ADDRESS } from '../../../constants';
import {
  IRevert, IStakeInfo, IUserOperationStruct, IValidationResult
} from '../interfaces';
import {
  checkDeadLine, checkEntryPointAddress, checkEntryPointInput, checkinitCode,
  checkPaymasterAndData, checkPaymasterValidation, checkSigFailed, checkUserOp,
  checkUserOpKey, checkUserOpValue
} from './checks';

export class ValidationManager {
    private entryPoint: Contract;

    constructor(entryPoint: Contract) {
        this.entryPoint = entryPoint;
    }

    public checkParameters(entryPointAddress: string, userOp: IUserOperationStruct, entryPointInput: string): void {
        checkEntryPointInput(entryPointInput);
        checkEntryPointAddress(entryPointAddress, entryPointInput);

        // minimal sanity check: userOp exists, and all members are hex
        checkUserOp(userOp);

        const fields = ['sender', 'nonce', 'initCode', 'callData', 'paymasterAndData', 'signature',
            'preVerificationGas', 'verificationGasLimit', 'callGasLimit', 'maxFeePerGas', 'maxPriorityFeePerGas'];

        fields.forEach(key => {
          checkUserOpKey(userOp, key as keyof IUserOperationStruct);
          const value: string = userOp[key as keyof IUserOperationStruct].toString();
          checkUserOpValue(key, value);
        });

        checkPaymasterAndData(userOp.paymasterAndData.length);
        checkinitCode(userOp.initCode.length);

    }

    async validateUserOp(userOp: IUserOperationStruct): Promise<IValidationResult> {
        const validationResult: IValidationResult = this.deepHexlify(await this._callSimulateValidation(userOp));

        checkSigFailed(validationResult);
        checkDeadLine(validationResult);

        return validationResult
    }

    async _callSimulateValidation(userOp: IUserOperationStruct): Promise<IValidationResult> {
        const errorResult = await this.entryPoint.simulateValidation.staticCall(userOp, { gasLimit: 10e6 }).catch(e => e)
        return this._parseErrorResult(userOp, errorResult)
    }

    _parseErrorResult(userOp: IUserOperationStruct, errorResult: IRevert): IValidationResult {
        if (!errorResult.revert.name.startsWith('ValidationResult')) {
            // parse it as FailedOp
            // if its FailedOp, then we have the paymaster param... otherwise its an Error(string)
            let paymaster = errorResult.revert.args.paymaster
            if (paymaster === ZERO_ADDRESS) {
                paymaster = undefined
            }
            // eslint-disable-next-line
            const msg: string = errorResult.revert.args.reason ?? errorResult.toString();
            checkPaymasterValidation(msg, paymaster);
        }

        const {
            returnInfo,
            senderInfo,
            factoryInfo,
            paymasterInfo
        }: IValidationResult = errorResult.revert.args

        const result: IValidationResult = {
            returnInfo: {
                preOpGas: returnInfo.preOpGas,
                prefund: returnInfo.prefund,
                sigFailed: returnInfo.sigFailed,
                deadline: returnInfo.deadline
            },
            senderInfo: {
                addr: userOp.sender,
                stake: senderInfo.stake,
                unstakeDelaySec: senderInfo.unstakeDelaySec
            },
            factoryInfo: {
                addr: this.getAddr(userOp.initCode),
                stake: factoryInfo?.stake ?? 0,
                unstakeDelaySec: factoryInfo?.unstakeDelaySec ?? 0
            },
            paymasterInfo: {
                addr: this.getAddr(userOp.paymasterAndData),
                stake: paymasterInfo?.stake ?? 0,
                unstakeDelaySec: paymasterInfo?.unstakeDelaySec ?? 0
            }
        }

        return result
    }

    // extract address from "data" (first 20 bytes)
    // add it as "addr" member to the "stakeinfo" struct
    // if no address, then return "undefined" instead of struct.
    public fillEntity(data: BytesLike, info: IStakeInfo): IStakeInfo | undefined {
        const addr = this.getAddr(data)
        return addr == null
            ? undefined
            : {
                ...info,
                addr
            }
    }

    public getAddr(data: BytesLike): string | undefined {
        if (data == null) {
            return undefined
        }
        const str = hexlify(data)
        if (str.length >= 42) {
            return str.slice(0, 42)
        }
        return undefined
    }

    public deepHexlify(obj: any): any {
        if (typeof obj === 'function') {
            return undefined
        }
        if (obj == null || typeof obj === 'string' || typeof obj === 'boolean') {
            return obj
        } else if (obj._isBigNumber != null || typeof obj !== 'object') {
            return toBeHex(obj).replace(/^0x0/, '0x')
        }
        if (Array.isArray(obj)) {
            return obj.map(member => this.deepHexlify(member))
        }
        return Object.keys(obj)
            .reduce((set, key) => ({
                ...set,
                [key]: this.deepHexlify(obj[key])
            }), {})
    }
}