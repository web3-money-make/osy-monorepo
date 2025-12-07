import { ValidationErrors } from '../../../errorEnum';
import { IUserOperationStruct } from '../../../interfaces';
import { requireCond } from '../../../require';

function checkUserOp(userOp: IUserOperationStruct) {
  requireCond(userOp != null, 'No UserOperation param');
}

function checkUserOpKey(userOp: IUserOperationStruct, userOpKey: keyof IUserOperationStruct) {
  requireCond(userOp[userOpKey] != null, 'Missing userOp field: ' + userOpKey + JSON.stringify(userOp), ValidationErrors.InvalidFields);
}

function checkUserOpValue(userOpKey:string, userOpValue: string) {
  const HEX_REGEX: RegExp = /^0x[a-fA-F\d]*$/i
  requireCond(userOpValue.match(HEX_REGEX) != null, `Invalid hex value for property ${userOpKey}:${userOpValue} in UserOp`, ValidationErrors.InvalidFields);
}

function checkPaymasterAndData(dataLength: number) {
  requireCond(dataLength === 2 || dataLength >= 42,
    'paymasterAndData: must contain at least an address',
    ValidationErrors.InvalidFields
  );
}

function checkinitCode(dataLength: number) {
  requireCond(dataLength === 2 || dataLength >= 42,
    'initCode: must contain at least an address',
    ValidationErrors.InvalidFields
  );
}

export {checkUserOp, checkUserOpKey, checkUserOpValue, checkPaymasterAndData, checkinitCode}