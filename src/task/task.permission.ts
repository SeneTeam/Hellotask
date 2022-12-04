import { InferSubjects, Permissions } from 'nest-casl';
import { Actions } from 'src/app.actions';
import { Roles } from 'src/app.roles';
import { Task } from './entities/task.entity';

export type Subjects = InferSubjects<typeof Task> | 'all';

export const permissions: Permissions<Roles, Subjects, Actions> = {
  admin({ can }) {
    can(Actions.manage, 'all');
  },

  user({ can }) {
    can(Actions.manage, 'all');
  },

  customer({ can }) {
    can(Actions.update, Task);
  },
};
