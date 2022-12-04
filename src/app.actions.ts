import { DefaultActions } from 'nest-casl';

enum CustomActions {
  createById = 'createById',
  readAll = 'readAll',
  readById = 'readById',
  updateById = 'updateById',
  deleteById = 'deleteById',
  reset = 'reset',
  cancel = 'cancel',
  createInvoice = 'createInvoice',
  createPayment = 'createPayment',
  createEstimate = 'createEstimate',
}

export type Actions = DefaultActions | CustomActions;
export const Actions = { ...DefaultActions, ...CustomActions };
