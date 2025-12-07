import { ValidationErrors } from '../../../errorEnum';
import { IValidationResult } from '../../../interfaces';
import { requireCond } from '../../../require';

function checkSigFailed(validationResult: IValidationResult) {
  requireCond(!validationResult.returnInfo.sigFailed,
    'Invalid UserOp signature or paymaster signature',
    ValidationErrors.InvalidSignature);
}

function checkDeadLine(validationResult: IValidationResult) {
  requireCond(validationResult.returnInfo.deadline == null || validationResult.returnInfo.deadline + 30 < Date.now() / 1000,
  'expires too soon',
  ValidationErrors.ExpiresShortly);
}

export {checkSigFailed, checkDeadLine}