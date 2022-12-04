import { InferSubjects, Permissions } from 'nest-casl';
import { Actions } from 'src/app.actions';
import { Roles } from 'src/app.roles';
import { Worker } from './entities/worker.entity';

export type Subjects =
  | InferSubjects<typeof Worker>
  | 'all';

export const permissions: Permissions<Roles, Subjects, Actions> = {
  admin({ can }) {
    can(Actions.manage, 'all');
  },

  user({ can }) {
    can(Actions.manage, 'all');
  },
};