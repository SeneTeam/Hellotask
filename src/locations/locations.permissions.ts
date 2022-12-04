import { InferSubjects } from '@casl/ability';
import { Permissions } from 'nest-casl';
import { Actions } from 'src/app.actions';
import { Roles } from 'src/app.roles';
import { Microarea } from './entities/microarea.entity';
import { SourcingZone } from './entities/sourcing_zone.entity';
import { Zone } from './entities/zone.entity';

export type Subjects =
  | InferSubjects<typeof Zone | typeof SourcingZone | typeof Microarea>
  | 'all';

// export type Subjects = InferSubjects<typeof Microarea>;

export const permissions: Permissions<Roles, Subjects, Actions> = {
  everyone({ can }) {
    can(Actions.read, 'all');
    can(Actions.reset, 'all');
  },

  user({ can }) {
    can(Actions.manage, 'all');
  },
};
