import { InferSubjects, Permissions } from 'nest-casl';
import { Actions } from 'src/app.actions';
import { Roles } from 'src/app.roles';
import { Estimate } from '../orders/entities/estimate.entity';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';

export type Subjects =
  | InferSubjects<typeof Invoice | typeof Payment>
  | typeof Estimate
  | 'all';

export const permissions: Permissions<Roles, Subjects, Actions> = {
  admin({ can }) {
    can(Actions.manage, 'all');
  },

  user({ can }) {
    can(Actions.manage, 'all');
  },

  customer({ can }) {
    can(Actions.createInvoice, Invoice);
    can(Actions.createPayment, Payment);
    can(Actions.createEstimate, Estimate);
  },
};
