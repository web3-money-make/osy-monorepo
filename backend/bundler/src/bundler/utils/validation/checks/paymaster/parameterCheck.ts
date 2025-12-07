import { ValidationErrors } from '../../../errorEnum';
import { RpcError } from '../../../rpcError';

function checkPaymasterValidation(msg: string, paymaster: any) {
  if (paymaster == null) {
    throw new RpcError(`account validation failed: ${msg}`, ValidationErrors.SimulateValidation)
  } else {
      throw new RpcError(`paymaster validation failed: ${msg}`, ValidationErrors.SimulatePaymasterValidation, { paymaster })
  }
}

export {checkPaymasterValidation}