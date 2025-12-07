import {
  ExecutionErrors, IEstimateUserOpGasResult, IMempoolUserOp, IStakeInfo,
  IUserOperationStruct, RpcError, ValidationErrors, ValidationManager
} from '../utils';
import { EvmHandler } from './evmHandler';

  export class MethodHandler extends EvmHandler {
      private validationManager: ValidationManager;

      constructor(
          providerUrl: string,
          entryPointAddress: string,
          privateKey: string | null
      ) {
          super(providerUrl, entryPointAddress, privateKey);

          this.validationManager = new ValidationManager(this.getEntryPointContract());
      }

      public getValidationManager(): ValidationManager {
        return this.validationManager;
      }

      async estimateUserOperationGas(userOp1: IUserOperationStruct, entryPointInput: string): Promise<IEstimateUserOpGasResult> {
          const userOp = {
              ...userOp1,
              // default values for missing fields.
              paymasterAndData: '0x',
              maxFeePerGas: 0,
              maxPriorityFeePerGas: 0,
              preVerificationGas: 0,
              verificationGasLimit: 10e6
          }

          // todo: checks the existence of parameters, but since we hexlify the inputs, it fails to validate
          await this.validationManager.checkParameters(this.getSupportedEntryPoints(), this.deepHexlify(userOp), entryPointInput)
          // todo: validation manager duplicate?
          const errorResult = await this.getEntryPointContract().simulateValidation.staticCall(userOp).catch(e => e)

          if (errorResult.revert.name === 'FailedOp') {
              throw new RpcError(errorResult.revert.args.at(-1), ValidationErrors.SimulateValidation)
          }
          // todo throw valid rpc error
          if (errorResult.revert.name !== 'ValidationResult') {
              throw errorResult
          }

          const { returnInfo } = errorResult.revert.args
          let {
              preOpGas,
              validAfter,
              validUntil
          } = returnInfo

          const callGasLimit = await this.getProvider().estimateGas({
              from: await this.getEntryPointContract().getAddress(),
              to: userOp.sender,
              data: userOp.callData as string
          }).catch(err => {
              const message = err.message.match(/reason="(.*?)"/)?.at(1) ?? 'execution reverted'
              throw new RpcError(message, ExecutionErrors.UserOperationReverted)
          })
          validAfter = BigInt(validAfter)
          validUntil = BigInt(validUntil)
          if (validUntil === BigInt(0)) {
              validUntil = 3735928559
          }
          if (validAfter === BigInt(0)) {
              validAfter = undefined
          }
          const preVerificationGas = this.calcPreVerificationGas(userOp)
          const verificationGas = BigInt(preOpGas)
          return {
              preVerificationGas,
              verificationGas,
              validAfter,
              validUntil,
              callGasLimit
          }
      }
  }