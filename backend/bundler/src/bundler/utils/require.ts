import { RpcError } from './rpcError';

export const HEX_REGEX = /^0x[a-fA-F\d]*$/i

export function requireCond(cond: boolean, msg: string, code?: number, data: any = undefined): void {
  if (!cond) {
      throw new RpcError(msg, code, data);
  }
}