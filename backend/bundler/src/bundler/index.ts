import { ErrorDescription, Signer } from 'ethers';

import { EvmHandler, MethodHandler } from './handler';
import { IMempoolUserOp, IUserOperationStruct } from './utils';

// is independent instance is better
export class Bundler extends MethodHandler {

  constructor(providerUrl: string, entryPointsContract: string, privateKey: string) {
    super(providerUrl, entryPointsContract, privateKey);
    if(this.getSigner() === null) {
      throw new Error("Signer config missing");
    }
  }

  public async sendBundle(userOp: IUserOperationStruct): Promise<string> {
    const provider = this.getProvider();
    const entryPoint = this.getEntryPointContract();
    const signer = this.getSigner();
    if(signer === null) {
      throw new Error("Signer config missing");
    }

    const beneficiary = await signer.getAddress();
    try {
      const feeData = await provider.getFeeData();
      const gasLimit = await entryPoint.handleOps.estimateGas([userOp], beneficiary);
      const tx = await entryPoint.handleOps([userOp], beneficiary, {
        type: 2,
        nonce: await signer.getNonce('pending'),
        gasLimit: Math.ceil(Number(gasLimit) * 1.5),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? 0,
        maxFeePerGas: feeData.maxFeePerGas ?? 0,
        chainId: provider._network.chainId
      });

      return tx.hash;
    } catch (e: any) {
      let parsedError: ErrorDescription | null
      try {
        parsedError = entryPoint.interface.parseError((e.data?.data ?? e.data))
      } catch (e1) {
        this.checkFatal(e)

        console.warn('Failed handleOps, but non-FailedOp error ', e);
        throw new Error('Failed handleOps, but non-FailedOp error');
      }

      if (parsedError === null) {
        throw new Error('Failed handleOps, but non-FailedOp error');
      }

      const {
        opIndex,
        reason
      } = parsedError.args
      const reasonStr: string = reason.toString()
      // TODO revert Case process
      if (reasonStr.startsWith('AA')) {
        throw new Error(reasonStr);
      } else {
        throw new Error(`Failed handleOps sender=${userOp.sender} reason=${reasonStr}`);
      }
    }
  }

  checkFatal(e: any): void {
    if (e.error?.code === -32601) {
      throw e
    }
  }
}