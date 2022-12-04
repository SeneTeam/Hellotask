import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { IvrService } from './ivr.service';
import {
  CreateIvrCallFlowDto,
  UpdateIvrCallFlowDto,
} from './dto/ivrCallFlow.dto';
import { AuthGuard } from '@nestjs/passport';
import { AccessGuard, UseAbility } from 'nest-casl';
import { Actions } from 'src/app.actions';
import { IvrCallFlows } from './entities/ivr_call_flows.entity';
import { IvrCallResponses } from './entities/ivr_call_responses.entity';
import { IvrPlacedCalls } from './entities/ivr_placed_calls.entity';
import { async } from 'rxjs';
import { AcceptOrderDto } from './dto/accept-order.dto';
import { BaseIvrCallbackDto } from './dto/base-ivr-callback.dto';
import { RejectOrderDto } from './dto/reject-order.dto';
import { Args } from '@nestjs/graphql';

// start: only for test function
import { OrdersService } from 'src/orders/orders.service';
import { CustomersService } from 'src/customers/customers.service';
import { OrderProposalCallVars } from './call_flow_vars/order/order_proposal_call.vars';
import { OrderWorkerPaymentNotificationVars } from './call_flow_vars/order/order_worker_payment_notification.vars';
import { WorkersService } from 'src/workers/workers.service';
import { OrderWorkerUnassignedCallVars } from './call_flow_vars/order/order_worker_unassigned_call.vars';
import { WorkerTrialFeedbackVars } from './call_flow_vars/task/trial/worker_trial_feedback.vars';
import { OrderConfirmationCallVars } from './call_flow_vars/order/order_confirmation_call.vars';
import { TaskCancelCallVars } from './call_flow_vars/task/task_cancel_call.vars';
import { CallbackWorkerGeneralVars } from './call_flow_vars/callbacks/callback_worker_general.vars';
import { TaskReminderCallVars } from './call_flow_vars/task/task_reminder_call.vars';
import { TaskService } from '../task/task.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TaskWorkerTrackingEta50PassedVars } from './call_flow_vars/task/task_worker_tracking_eta_50_passed.vars';
import { OrderCancelCallVars } from './call_flow_vars/order/order_cancel.vars';
import { WorkTimePreferenceUpdateCall } from './call_flow_vars/work-time-preference/work_time_preference_update_call.vars';
import { TimePreferenceIvrCallbackDto } from './dto/time-preference-callback.dto';
// end: only for test function

@Controller('ivr')
export class IvrController {
  constructor(
    private readonly ivrService: IvrService,

    // start: only for test function

    @Inject(OrdersService)
    private ordersService: OrdersService,
    @Inject(CustomersService)
    private customerService: CustomersService,
    @Inject(WorkersService)
    private readonly workersService: WorkersService, // end: only for test function
    @Inject(TaskService)
    private readonly taskService: TaskService,
  ) {}

  @UseGuards(AuthGuard('firebase'))
  @UseAbility(Actions.readAll, IvrCallFlows)
  @Get('callflows')
  getIvrCallFlows() {
    return this.ivrService.getIvrCallFlows();
  }

  @UseGuards(AuthGuard('firebase'))
  @UseAbility(Actions.readById, IvrCallResponses)
  @Get('callflow/:id')
  getIvrCallFlow(@Param('id') id: string) {
    return this.ivrService.getIvrCallFlow({ id: id });
  }

  @UseGuards(AuthGuard('firebase'))
  @UseAbility(Actions.readById, IvrPlacedCalls)
  @Get('callflow/name/:name')
  getIvrCallFlowByName(@Param('name') name: string) {
    return this.ivrService.getIvrCallFlow({ name: name });
  }

  @UseGuards(AuthGuard('firebase'))
  @UseAbility(Actions.create, IvrCallFlows)
  @Post('callflow')
  createIvrCallFlow(@Body() CreateIvrCallFlowDto: CreateIvrCallFlowDto) {
    return this.ivrService.createIvrCallFlow(CreateIvrCallFlowDto);
  }

  @UseGuards(AuthGuard('firebase'))
  @UseAbility(Actions.update, IvrCallFlows)
  @Patch('callflow/:id')
  updateIvrCallFlow(
    @Param('id') id: string,
    @Body() updateIvrCallFlowDto: UpdateIvrCallFlowDto,
  ) {
    return this.ivrService.updateIvrCallFlow(id, updateIvrCallFlowDto);
  }

  @UseGuards(AuthGuard('firebase'))
  @UseAbility(Actions.delete, IvrCallFlows)
  @Delete('callflow/:id')
  remove(@Param('id') id: string) {
    return this.ivrService.deleteIvrCallFlow(id);
  }

  @Post('test')
  @UseGuards(AuthGuard('ipn-api-key'))
  async test(
    @Args('order_id') order_id: string,
    @Args('worker_id') worker_id: number,
  ) {
    console.log(order_id, '-', worker_id);

    const order = await this.ordersService.getOrderById(order_id);
    const worker = await this.workersService.findOneWorkerById(worker_id);

    const IVRCallFlowVars = await WorkTimePreferenceUpdateCall.init(
      // order,
      worker,
    );

    await this.ivrService.placeIVRCall(
      'WORK_TIME_PREFERENCE_UPDATE_CALL',
      IVRCallFlowVars,
      order,
      worker,
    );

    return;
  }

  @Post('order/accept')
  @UseGuards(AuthGuard('ipn-api-key'))
  async acceptOrder(@Body() acceptOrderDto: AcceptOrderDto) {
    // return this.ivrService.placeIVRCall('acceptOrder', order);
    // Call the worker about the order

    return await this.ivrService.acceptOrder(acceptOrderDto);
  }

  @Post('order/cancel')
  @UseGuards(AuthGuard('ipn-api-key'))
  async cancelOrder(@Args('order_id') order_id: string) {
    return await this.ivrService.cancelOrder(order_id);
  }

  @Post('order/accept/confirmation/cancel')
  @UseGuards(AuthGuard('ipn-api-key'))
  async cancelOrderOnConfirmation(@Body() rejectOrderDto: RejectOrderDto) {
    // return this.ivrService.placeIVRCall('acceptOrder', order);
    return await this.ivrService.rejectOrder(rejectOrderDto);
  }

  @Post('order/reject')
  @UseGuards(AuthGuard('ipn-api-key'))
  async rejectOrder(@Body() rejectOrderDto: RejectOrderDto) {
    return await this.ivrService.rejectOrder(rejectOrderDto);
  }

  @Post('call/recieve')
  @UseGuards(AuthGuard('ipn-api-key'))
  async receiveCall(@Body() callbackDto: BaseIvrCallbackDto) {
    // return this.ivrService.placeIVRCall('acceptOrder', order);
    return await this.ivrService.receiveCall(callbackDto);
  }

  // Worker Calling Customer
  @Post('order/worker-calling-customer')
  @UseGuards(AuthGuard('ipn-api-key'))
  async workerCallingCustomer(@Body() callbackDto: BaseIvrCallbackDto) {
    // Worker Calling Customer
  }

  // Worker Calling Agent
  @Post('order/worker-calling-agent')
  @UseGuards(AuthGuard('ipn-api-key'))
  async workerCallingAgent(@Body() callbackDto: BaseIvrCallbackDto) {
    // Worker Calling Agent
  }

  // worker Starting Task
  @Post('order/worker-start-task')
  @UseGuards(AuthGuard('ipn-api-key'))
  async workerStartTask(@Body() callbackDto: BaseIvrCallbackDto) {
    // worker Starting Task
    this.taskService.startCurrentPendingTaskByOrderId(callbackDto.order_id);
  }

  // worker Ending Task
  @Post('order/worker-end-task')
  @UseGuards(AuthGuard('ipn-api-key'))
  async workerEndTask(@Body() callbackDto: BaseIvrCallbackDto) {
    // worker Ending Task
    this.taskService.completeCurrentInProgressTaskByOrderId(
      callbackDto.order_id,
    );
  }

  // Callback Request from IVR When a Worker Calls our IVR number.
  @Post('call/request')
  @UseGuards(AuthGuard('ipn-api-key'))
  async requestCall(@Args('phone_number') phone_number: string) {
    // console.log('Callback Request', phone_number);
    return await this.ivrService.callbackRequest(phone_number);
  }

  @Post('order/on-the-way')
  @UseGuards(AuthGuard('ipn-api-key'))
  async workerOnTheWay(@Body() callbackDto: BaseIvrCallbackDto) {
    return await this.ivrService.workerOnTheWay(callbackDto);
  }

  @Post('callback/update-working-time')
  // @UseGuards(AuthGuard('ipn-api-key'))
  async workerArrived(
    @Body() timePreferenceCallbackDto: TimePreferenceIvrCallbackDto,
  ) {
    return await this.ivrService.updateWorkingTime(timePreferenceCallbackDto);
  }

  @Post('schedule-call/received')
  // @UseGuards(AuthGuard('ipn-api-key'))
  async scheduleCallReceived(
    @Body() timePreferenceCallbackDto: TimePreferenceIvrCallbackDto,
  ) {
    return await this.ivrService.scheduleCallReceived(
      timePreferenceCallbackDto,
    );
  }

  @Get('ivrResponseOfOrder/:order_id')
  async getIvrResponseOfOrder(@Param('order_id') order_id: string) {
    return await this.ivrService.getIvrResponseOfOrder(order_id);
  }
}
