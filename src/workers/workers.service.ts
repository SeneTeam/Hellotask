import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom, map } from 'rxjs';
import { PaginateInput } from 'src/common/dto/paginate.input';
import { CallbackWorkerGeneralVars } from 'src/ivr/call_flow_vars/callbacks/callback_worker_general.vars';
import { LocationsService } from 'src/locations/locations.service';
import { Repository, MoreThan, LessThan, In, Between } from 'typeorm';
import { CustomersService } from '../customers/customers.service';
import { CallbackTaskWorkerActiveTaskVars } from '../ivr/call_flow_vars/callbacks/callback_task_worker_active_task.vars';
import { TaskWorkerTrackingEtaExceededVars } from '../ivr/call_flow_vars/task/task_worker_tracking_eta_exceeded.vars';
import { Task, TaskStatus } from '../task/entities/task.entity';
import { Order } from '../orders/entities/order.entity';
import {
  CreateWorkerInput,
  IdentityDocInput,
  PaymentInfoInput,
} from './dto/create-worker.input';
import {
  UpdatePaymentInfoInput,
  UpdateWorkerInput,
} from './dto/update-worker.input';
import { IdentityDoc } from './entities/identity-doc.entity';
import { WorkerPaymentMethod } from './entities/worker-payment-method.entity';
import {
  WorkerStatus,
  WorkerStatusEnum,
} from './entities/worker-status.entity';
import { Worker } from './entities/worker.entity';
import { CallbackTaskWorkerWithinEtaVars } from '../ivr/call_flow_vars/callbacks/callback_task_worker_within_eta.vars';
import { WorkerTimePreferenceResponse } from './entities/worker-time-preference-response.entity';
import { IvrMessageFlag } from '../ivr/ivr-msg-flag.enum';

@Injectable()
export class WorkersService {
  constructor(
    @InjectRepository(Worker)
    private workerRepository: Repository<Worker>,
    @InjectRepository(IdentityDoc)
    private identityDocRepository: Repository<IdentityDoc>,
    @InjectRepository(WorkerPaymentMethod)
    private paymentInfoRepository: Repository<WorkerPaymentMethod>,
    @InjectRepository(WorkerStatus)
    private workerStatusRepository: Repository<WorkerStatus>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(WorkerTimePreferenceResponse)
    private workerTimePreference: Repository<WorkerTimePreferenceResponse>,
    private readonly httpService: HttpService,
    @Inject(LocationsService)
    private readonly locationService: LocationsService,
    @Inject(CustomersService)
    private readonly customerService: CustomersService,
  ) {}

  async getEwalletBalance(workerId: number) {
    // get url from the environment file
    const url =
      process.env.FINANCE_API_ENDPOINT + '/workerwallet/balance/' + workerId;

    // get API key from the environment file
    const apiKey = process.env.FINANCE_API_KEY;

    // create header
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    };

    // send request to finance api
    const response = await this.httpService.get(url, { headers }).pipe(
      map((res) => {
        return res.data;
      }),
    );

    // convert obeservable to promise
    return await lastValueFrom(response)
      .then(async (res) => {
        return res.balance;
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  async getEwalletTransaction(workerId: number) {
    // get url from the environment file
    const url =
      process.env.FINANCE_API_ENDPOINT +
      '/workerwallet/transactions/' +
      workerId;

    // get API key from the environment file
    const apiKey = process.env.FINANCE_API_KEY;

    // create header
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    };

    // send request to finance api
    const response = await this.httpService.get(url, { headers }).pipe(
      map((res) => {
        return res.data;
      }),
    );

    // convert obeservable to promise
    return await lastValueFrom(response)
      .then(async (res) => {
        return res;
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  async getPorichoyResponse(identityDocInput: IdentityDocInput) {
    // get url from the environment file
    const url =
      process.env.PORICHOY_ENDPOINT + '/nid/' + identityDocInput.id_number;
    // get API key from the environment file
    const apiKey = process.env.PORICHOY_API_KEY;

    const params = { dob: identityDocInput.date_of_birth };

    // create header
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    };

    // send request to Porichoy
    const response = await this.httpService.get(url, { params, headers }).pipe(
      map((res) => {
        return res.data;
      }),
    );

    // convert obeservable to promise
    return await lastValueFrom(response)
      .then(async (res) => {
        return res.data;
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  async createWorker(
    createWorkerInput: CreateWorkerInput,
    identityDocInput: IdentityDocInput,
    paymentInfoInputs: PaymentInfoInput[],
  ) {
    // Identity Doc Start ---------------------------------------------------
    // get porichoy response
    const porichoyResponse = await this.getPorichoyResponse(identityDocInput);
    // create identity doc
    const identityDoc = new IdentityDoc();
    // convert YYYY-MM-DD to Date
    identityDoc.date_of_birth = new Date(identityDocInput.date_of_birth);
    // remove date_of_birth from porichoy identityDocInput
    delete identityDocInput.date_of_birth;
    // assign identityDocInput to identityDoc
    Object.assign(identityDoc, identityDocInput);
    identityDoc.id_verification_response = porichoyResponse;

    // save identity doc
    const savedIdentityDoc = await this.identityDocRepository.save(identityDoc);

    // Identity Doc End ---------------------------------------------------

    // Payment Info Start ---------------------------------------------------
    // create payment info
    const paymentInfos = paymentInfoInputs.map((paymentInfoInput) => {
      const paymentInfo = new WorkerPaymentMethod();
      Object.assign(paymentInfo, paymentInfoInput);
      return paymentInfo;
    });

    // save payment info one by one
    const savedPaymentInfos = await Promise.all(
      paymentInfos.map((paymentInfo) => {
        return this.paymentInfoRepository.save(paymentInfo);
      }),
    );

    // Payment Info End ---------------------------------------------------

    // Worker Start ---------------------------------------------------
    // create worker
    const worker = new Worker();
    worker.bangla_name = porichoyResponse.nid.fullNameBN;
    worker.english_name = porichoyResponse.nid.fullNameEN;
    worker.phone_number = createWorkerInput.phone_number;
    //worker.worker_type = createWorkerInput.;
    worker.present_address = createWorkerInput.present_address;

    worker.permanent_address = porichoyResponse.nid.permenantAddressEN;

    worker.photo_url = porichoyResponse.nid.photoUrl;
    worker.emergency_contact = createWorkerInput.emergency_contact;
    // worker.sourcingZoneId = createWorkerInput.sourcing_zone_id;

    const sourcingZone = await this.locationService.findOneSourcingZoneById(
      createWorkerInput.sourcing_zone_id,
    );

    // get all microares from createWorkerInput.micro_areas
    const microAreas = await Promise.all(
      createWorkerInput.microarea_ids.map((microArea) => {
        return this.locationService.findOneMicroareaById(microArea);
      }),
    );
    //worker.referencedById = createWorkerInput.;

    worker.sourcingZone = sourcingZone;
    worker.microareas = microAreas;

    worker.identity_docs = [savedIdentityDoc];
    worker.workerPaymentMethods = savedPaymentInfos;

    // save worker
    const savedWorker: Worker = await this.workerRepository.save(worker);
    // Worker End ---------------------------------------------------

    // Worker Status Start ---------------------------------------------------
    // create worker status
    const workerStatus = new WorkerStatus();
    workerStatus.worker = savedWorker;
    workerStatus.status = WorkerStatusEnum.TRAINEE;
    workerStatus.note =
      'New worker created and assigned to TRAINEE status by default';

    // save worker status
    await this.workerStatusRepository.save(workerStatus);

    // Worker Status End ---------------------------------------------------

    // get worker by id with relations
    const workerById = await this.workerRepository.findOne({
      where: { id: savedWorker.id },
      relations: [
        'identity_docs',
        'workerPaymentMethods',
        'sourcingZone',
        'microareas',
      ],
    });

    return workerById;
  }

  async findAllWorkers(paginateInput: PaginateInput) {
    // get all workers where isDeleted is false with all relations
    const workers = await this.workerRepository.find({
      relations: [
        'identity_docs',
        'workerPaymentMethods',
        'sourcingZone',
        'microareas',
        'worker_status',
      ],
      where: { isDeleted: false },
      skip: paginateInput.skip,
      take: paginateInput.take,
    });

    for (const worker of workers) {
      // add e-wallet balance to worker
      worker.walletBalance = await this.getEwalletBalance(worker.id);
      // add e-wallet transactions to worker
      worker.transactionHistory = await this.getEwalletTransaction(worker.id);
    }
    return workers;
  }

  async findOneWorkerById(id: number) {
    const worker = await this.workerRepository.findOne({
      where: { id, isDeleted: false },
      relations: [
        'identity_docs',
        'workerPaymentMethods',
        'sourcingZone',
        'microareas',
        'worker_status',
      ],
      order: {
        worker_status: {
          created_at: 'DESC',
        },
      },
    });

    if (!worker) {
      throw new NotFoundException(`Worker with ID "${id}" not found`);
    }

    // add e-wallet balance to worker
    worker.walletBalance = await this.getEwalletBalance(worker.id);

    // add e-wallet transactions to worker
    worker.transactionHistory = await this.getEwalletTransaction(worker.id);

    return worker;
  }

  async updateWorker(
    id: number,
    updateWorkerInput: UpdateWorkerInput,
    updatePaymentInfoInput: UpdatePaymentInfoInput[],
  ) {
    // get worker by id with payment info relations and isDeleted is false
    const worker: Worker = await this.workerRepository.findOne({
      where: { id: id, isDeleted: false },
      relations: ['workerPaymentMethods', 'microareas'],
    });

    // Throw HTTP Not Found error if zone is not found
    if (!worker) {
      throw new HttpException('Worker not found', HttpStatus.NOT_FOUND);
    }

    // get sourcingzones from updateWorkerInput and assign to worker if not null
    if (updateWorkerInput.sourcing_zone_id) {
      const sourcingZone = await this.locationService.findOneSourcingZoneById(
        updateWorkerInput.sourcing_zone_id,
      );
      worker.sourcingZone = sourcingZone;
    }

    // get microareas from updateWorkerInput and assign to worker if any and not null
    if (updateWorkerInput.microarea_ids) {
      const microAreas = await Promise.all(
        updateWorkerInput.microarea_ids.map((microArea) => {
          return this.locationService.findOneMicroareaById(microArea);
        }),
      );
      worker.microareas = microAreas;
    }

    // Object.assign does not deep copy nested objects
    if (updateWorkerInput.emergency_contact) {
      worker.emergency_contact = JSON.parse(
        JSON.stringify(updateWorkerInput.emergency_contact),
      );
    }

    // remove sourcing_zone_id and microarea_ids from updateWorkerInput
    delete updateWorkerInput.sourcing_zone_id;
    delete updateWorkerInput.microarea_ids;
    delete updateWorkerInput.emergency_contact;

    // assign updateWorkerInput to worker
    Object.assign(worker, updateWorkerInput);

    // if updatePaymentInfoInput is not empty
    if (updatePaymentInfoInput) {
      // get paymentInfos from updatePaymentInfoInput
      const newPaymentInfos = updatePaymentInfoInput;

      // count paymentInfos in newPaymentInfos where isDefault is true
      const defaultPaymentInfoCount = newPaymentInfos.filter(
        (paymentInfo) => paymentInfo.is_default === true,
      ).length;

      // if defaultPaymentInfoCount is greater than 1 then throw error
      if (defaultPaymentInfoCount > 1) {
        throw new HttpException(
          'Only one default payment method is allowed',
          HttpStatus.BAD_REQUEST,
        );
      }

      // get paymentInfos from worker
      const oldPaymentInfos = worker.workerPaymentMethods;

      // check if there is intersection between oldPaymentInfos and newPaymentInfos
      const intersection = oldPaymentInfos.filter((oldPaymentInfo) => {
        return newPaymentInfos.some((newPaymentInfo) => {
          return (
            oldPaymentInfo.account_number === newPaymentInfo.account_number &&
            oldPaymentInfo.payment_method === newPaymentInfo.payment_method
          );
        });
      }).length;

      if (intersection > 0) {
        throw new HttpException(
          'New payment method(s) is/are conflicting with existing payment method(s)',
          HttpStatus.BAD_REQUEST,
        );
      }

      // for each payment info in newPaymentInfos assign payment info to worker and save to db
      for (const paymentInfo of newPaymentInfos) {
        if (paymentInfo.is_default) {
          // if payment info is default then set isDefault to false for all other payment info
          for (const oldPaymentInfo of oldPaymentInfos) {
            oldPaymentInfo.is_default = false;
            await this.paymentInfoRepository.save(oldPaymentInfo);
          }
        }
        const savedPaymentInfo = await this.paymentInfoRepository.save(
          paymentInfo,
        );
        worker.workerPaymentMethods.push(savedPaymentInfo);
      }
    }

    // save worker
    return await this.workerRepository.save(worker);
  }

  async deleteWorker(id: number) {
    const worker = await this.workerRepository.findOne({
      where: { id, isDeleted: false },
    });

    // Throw HTTP Not Found error if zone is not found
    if (!worker) {
      throw new HttpException('Worker not found', HttpStatus.NOT_FOUND);
    }

    // set isDeleted to true
    worker.isDeleted = true;

    return await this.workerRepository.save(worker);
  }

  async getActiveWorkersByMicroareaId(id: number) {
    const microarea = await this.locationService.findOneMicroareaById(id);

    if (!microarea) {
      throw new HttpException('Microarea not found', HttpStatus.NOT_FOUND);
    }

    // get all workers with isDeleted is false and microareas contain id
    const workers = await this.workerRepository.find({
      where: { isDeleted: false, microareas: { id: id } },
      relations: {
        worker_status: true,
      },
    });

    const activeWorkers: Worker[] = [];

    for (const worker of workers) {
      // get last status of worker
      const lastStatus = await this.workerStatusRepository.findOne({
        where: { worker: { id: worker.id } },
        order: { created_at: 'DESC' },
      });

      // if last status is active then push to activeWorkers
      if (lastStatus.status === WorkerStatusEnum.ACTIVE) {
        // const onlineWorker = await this.checkIfWorkerOnline(worker.id);
        // if (onlineWorker && onlineWorker['is_agreed']) {
        activeWorkers.push(worker);
      }
      // }
    }
    return activeWorkers;
  }

  async prepareCallbackDataForWorker(worker: Worker) {
    // Get Date with 0 Hour
    const dateToday = new Date();
    dateToday.setHours(0, 0, 0, 0);

    // Worker Order Ids
    const workerOrderIds = worker.OrderWorkers.map((orderWorker) => {
      return orderWorker.orderId;
    });

    // Check if Worker have Task Pending
    const havePendingTaskToday = await this.taskRepository.findOne({
      where: {
        order: {
          id: In(workerOrderIds),
        },
        taskStatus: TaskStatus.PENDING,
        taskStartTime: MoreThan(dateToday),
      },
      order: {
        taskStartTime: 'ASC',
      },
      relations: {
        order: {
          customer: {
            customer_addresses: true,
          },
          microarea: true,
          estimate: true,
        },
      },
    });

    const haveInProgressToday = await this.taskRepository.findOne({
      where: {
        order: {
          id: In(workerOrderIds),
        },
        taskStatus: TaskStatus.IN_PROGRESS,
        taskStartTime: MoreThan(dateToday),
      },
      order: {
        taskStartTime: 'ASC',
      },
      relations: {
        order: {
          customer: {
            customer_addresses: true,
          },
          microarea: true,
          estimate: true,
        },
      },
    });

    let callFlowId;
    let IVRCallFlowVars;
    let order = null;

    if (haveInProgressToday) {
      // If have in progress task, then send worker in progress callback
      order = haveInProgressToday.order;
      callFlowId = 'CALLBACK_TASK_WORKER_ACTIVE_TASK';
      IVRCallFlowVars = await CallbackTaskWorkerActiveTaskVars.init(
        order,
        worker,
      );
    } else if (havePendingTaskToday) {
      order = havePendingTaskToday.order;
      if (await this.checkIfWorkerInETAForInstant(order)) {
        callFlowId = 'CALLBACK_TASK_WORKER_WITHIN_ETA';
        IVRCallFlowVars = await CallbackTaskWorkerWithinEtaVars.init(
          order,
          worker,
          this.customerService,
        );
      } else {
        callFlowId = 'CALLBACK_WORKER_GENERAL';
        IVRCallFlowVars = await CallbackWorkerGeneralVars.init(worker);
      }
    } else {
      callFlowId = 'CALLBACK_WORKER_GENERAL';
      IVRCallFlowVars = await CallbackWorkerGeneralVars.init(worker);
    }

    return {
      callFlowId: callFlowId,
      IVRCallFlowVars: IVRCallFlowVars,
      order: order,
    };
  }

  async createNewTimePreferenceResponse(worker_id: number, _response) {
    const worker = await this.workerRepository.findOne({
      where: { id: worker_id },
    });

    if (!worker) {
      return new HttpException('Worker not found', HttpStatus.NOT_FOUND);
    }

    const newCall = new WorkerTimePreferenceResponse();
    newCall.callId = _response['callId'];
    newCall.worker = worker;
    newCall.response = _response;
    return await this.workerTimePreference.save(newCall);
  }

  async updateTimePreferenceResponse(call_id: string, _response) {
    const callResponse = await this.workerTimePreference.findOne({
      where: { callId: call_id },
    });

    const newRetryCount = callResponse.retryCount + 1;

    callResponse.callId = _response['callId'];
    callResponse.retryCount = newRetryCount;
    callResponse.response = _response;

    return await this.workerTimePreference.save(callResponse);
  }

  async checkIfWorkerInETAForInstant(order: Order) {
    const dateToday = new Date();
    dateToday.setHours(0, 0, 0, 0);

    const dateTomorrow = new Date();
    dateTomorrow.setDate(dateTomorrow.getDate() + 1);
    dateTomorrow.setHours(0, 0, 0, 0);

    const task = await this.taskRepository.findOne({
      where: {
        order: { id: order.id },
        taskStatus: TaskStatus.PENDING,
        taskStartTime: MoreThan(dateToday),
        taskEndTime: LessThan(dateTomorrow),
      },
    });

    if (new Date() <= task.taskEndTime) {
      return true;
    }

    return false;
  }

  async checkIfWorkerOnline(workerId: number) {
    const dateYesterday = new Date();
    dateYesterday.setDate(dateYesterday.getDate() - 1);
    dateYesterday.setHours(0, 0, 0, 0);

    const workerResponse = await this.workerTimePreference.findOne({
      where: { worker: { id: workerId }, created_at: MoreThan(dateYesterday) },
    });

    return workerResponse;
  }

  async getWorkerTimePreferenceResponse(
    workerResponse: WorkerTimePreferenceResponse,
    order_id: string,
  ) {
    const order = await this.orderRepository.findOne({
      where: { id: order_id },
    });

    const now = new Date();
    const morningTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      2,
      0,
      0,
      0,
    );
    const eveningTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      7,
      0,
      0,
      0,
    );

    if (workerResponse.prefered_time == 'any_time') {
      return true;
    }

    if (
      order.orderStartTime >= morningTime &&
      order.orderStartTime < eveningTime &&
      workerResponse.prefered_time == 'morning'
    ) {
      return true;
    }

    if (
      order.orderStartTime >= eveningTime &&
      workerResponse.prefered_time == 'evening'
    ) {
      return true;
    }

    return false;
  }
}
