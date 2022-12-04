import { InferSubjects, Permissions } from 'nest-casl';
import { userInfo } from 'os';
import { Actions } from 'src/app.actions';
import { Roles } from 'src/app.roles';
import { User } from './entities/user.entity';

export type Subjects = InferSubjects<typeof User> | 'all';

export const permissions: Permissions<Roles, Subjects, Actions> = {
  admin({ can }) {
    can(Actions.manage, 'all');
  },

  user({ user, can }) {
    can(Actions.read, User, { id: user.id });
    // can(Actions.update, User, { id: user.id });
  },
};
