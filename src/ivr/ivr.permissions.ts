import { InferSubjects, Permissions } from 'nest-casl';
import { Actions } from 'src/app.actions';
import { Roles } from 'src/app.roles';
import { IvrCallFlows } from './entities/ivr_call_flows.entity';
import { IvrCallResponses } from './entities/ivr_call_responses.entity';
import { IvrPlacedCalls } from './entities/ivr_placed_calls.entity';

export type Subjects =
  | InferSubjects<typeof IvrCallFlows>
  | typeof IvrCallResponses
  | typeof IvrPlacedCalls
  | 'all';

export const permissions: Permissions<Roles, Subjects, Actions> = {
  admin({ can }) {
    can(Actions.manage, 'all');
  },
};
