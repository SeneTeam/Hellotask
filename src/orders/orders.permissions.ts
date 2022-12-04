import { InferSubjects, Permissions } from 'nest-casl';
import { Actions } from 'src/app.actions';
import { Roles } from 'src/app.roles';
import { Order } from './entities/order.entity';

export type Subjects = InferSubjects<typeof Order> | 'all';

export const permissions: Permissions<Roles, Subjects, Actions> = {
  admin({ can }) {
    can(Actions.manage, 'all');
  },

  user({ can }) {
    can(Actions.manage, 'all');
  },

  customer({ user, can }) {
    can(Actions.create, 'all', { customerId: user.id });
    can(Actions.read, 'all', { customerId: user.id });
    can(Actions.cancel, 'all', { customerId: user.id });
  },
};
