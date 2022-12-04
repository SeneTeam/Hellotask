import { InferSubjects, Permissions } from 'nest-casl';
import { Actions } from 'src/app.actions';
import { Roles } from 'src/app.roles';
import { CustomerAddress } from './entities/customer-address.entity';
import { Customer } from './entities/customer.entity';

export type Subjects =
  | InferSubjects<typeof Customer | typeof CustomerAddress>
  | 'all';

export const permissions: Permissions<Roles, Subjects, Actions> = {
  admin({ can }) {
    can(Actions.manage, 'all');
  },

  user({ can }) {
    can(Actions.manage, 'all');
  },

  customer({ user, can }) {
    can(Actions.create, CustomerAddress, { customerId: user.id });
    can(Actions.read, Customer, { id: user.id });
    can(Actions.update, Customer, { id: user.id });
    can(Actions.delete, Customer, { id: user.id });
  },

  prospective_customer({ can }) {
    can(Actions.create, Customer);
  },
};
