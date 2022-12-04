import { InferSubjects, Permissions } from 'nest-casl';
import { Actions } from 'src/app.actions';
import { Roles } from 'src/app.roles';
import { Package } from './entities/package.entity';

export type Subjects = InferSubjects<typeof Package> | 'all';

export const permissions: Permissions<Roles, Subjects, Actions> = {
  admin({ can }) {
    can(Actions.manage, 'all');
  },

  user({ can }) {
    can(Actions.read, 'all');
    can(Actions.readById, 'all');
  },

  customer({ can }) {
    can(Actions.read, 'all');
    can(Actions.readById, 'all');
  },
};
