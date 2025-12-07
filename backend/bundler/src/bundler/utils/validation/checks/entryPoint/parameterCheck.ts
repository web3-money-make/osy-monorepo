import { ValidationErrors } from '../../../errorEnum';
import { requireCond } from '../../../require';

function checkEntryPointAddress(entryPointAddress: string, entryPointInput: string){
    if (entryPointInput.toString().toLowerCase() !== entryPointAddress.toLowerCase()) {
      throw new Error(`The EntryPoint at "${entryPointInput}" is not supported. This bundler uses ${entryPointAddress}`);
    }
}

function checkEntryPointInput(entryPointInput: string) {
  requireCond(entryPointInput != null, 'No entryPoint param', ValidationErrors.InvalidFields);
}

export { checkEntryPointAddress, checkEntryPointInput };
