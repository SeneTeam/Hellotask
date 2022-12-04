import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { WorkersService } from './workers.service';
import { Worker } from './entities/worker.entity';
import {
  CreateWorkerInput,
  IdentityDocInput,
  PaymentInfoInput,
} from './dto/create-worker.input';
import {
  UpdatePaymentInfoInput,
  UpdateWorkerInput,
} from './dto/update-worker.input';
import { Inject, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/gql.auth.guard';
import { AccessGuard, UseAbility } from 'nest-casl';
import { Actions } from 'src/app.actions';
import { PaginateInput } from 'src/common/dto/paginate.input';
import { CurrentUser } from 'src/auth/gql.user.decorator';
import { userInfo } from 'os';
import {
  WalletCreditResponse,
  WalletDebitResponse,
  WorkerWalletCreditInput,
} from './dto/wallet-credit.dto';
import { FinanceService } from 'src/finance/finance.service';
import { WorkerWalletDebitInput } from './dto/wallet-debit.dto';

@Resolver(() => Worker)
export class WorkersResolver {
  constructor(
    private readonly workersService: WorkersService,
    @Inject(FinanceService)
    private readonly financeService: FinanceService,
  ) {}

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.create, Worker)
  @Mutation(() => Worker, { name: 'createWorker' })
  async createWorker(
    @Args('createWorkerInput') createWorkerInput: CreateWorkerInput,
    @Args('identityDocInput') identityDocInput: IdentityDocInput,
    @Args({ name: 'paymentInfoInputs', type: () => [PaymentInfoInput] })
    paymentInfoInputs: PaymentInfoInput[],
  ) {
    return this.workersService.createWorker(
      createWorkerInput,
      identityDocInput,
      paymentInfoInputs,
    );
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.read, Worker)
  @Query(() => [Worker], { name: 'getAllWorkers' })
  async findAll(
    @Args('paginate', { nullable: true, defaultValue: { skip: 0, take: 10 } })
    paginateInput: PaginateInput,
  ) {
    return await this.workersService.findAllWorkers(paginateInput);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.readById, Worker)
  @Query(() => Worker, { name: 'getWorkerById' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return await this.workersService.findOneWorkerById(id);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.updateById, Worker)
  @Mutation(() => Worker, { name: 'updateWorker' })
  async updateWorker(
    @Args('id') id: number,
    @Args('updateWorkerInput', { nullable: true })
    updateWorkerInput: UpdateWorkerInput,
    @Args({
      name: 'updatePaymentInfoInput',
      type: () => [UpdatePaymentInfoInput],
      nullable: true,
    })
    updatePaymentInfoInput: UpdatePaymentInfoInput[],
  ) {
    return await this.workersService.updateWorker(
      id,
      updateWorkerInput,
      updatePaymentInfoInput,
    );
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.delete, Worker)
  @Mutation(() => Worker, { name: 'deleteWorker' })
  async deleteWorker(@Args('id', { type: () => Int }) id: number) {
    return await this.workersService.deleteWorker(id);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.create, Worker)
  @Mutation(() => WalletCreditResponse, { name: 'workerWalletCredit' })
  async workerWalletCredit(
    @CurrentUser() user,
    @Args('workerWalletCreditInput')
    workerrWalletCreditInput: WorkerWalletCreditInput,
  ) {
    const res = await this.financeService.workerWalletCredit(
      user,
      workerrWalletCreditInput,
    );

    // initialize worker wallet credit response
    const walletCreditResponse = new WalletCreditResponse();
    walletCreditResponse.transaction_id = res.id;
    walletCreditResponse.type = res.type;
    walletCreditResponse.amount = res.amount;
    walletCreditResponse.reference = res.reference;

    return walletCreditResponse;
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.create, Worker)
  @Mutation(() => WalletDebitResponse, { name: 'workerWalletDebit' })
  async workerWalletDebit(
    @CurrentUser() user,
    @Args('workerWalletDebitInput')
    workerWalletDebitInput: WorkerWalletDebitInput,
  ) {
    const res = await this.financeService.workerWalletDebit(
      user,
      workerWalletDebitInput,
    );

    // initialize worker wallet credit response
    const walletDebitResponse = new WalletDebitResponse();
    walletDebitResponse.transaction_id = res.id;
    walletDebitResponse.type = res.type;
    walletDebitResponse.amount = res.amount;
    walletDebitResponse.reference = res.reference;

    return walletDebitResponse;
  }

  // get free active workers mutation
  @Mutation(() => [Worker], { name: 'getActiveWorkers' })
  async getActiveWorkers(@Args('microarea_id') microarea_id: number) {
    return await this.workersService.getActiveWorkersByMicroareaId(
      microarea_id,
    );
  }
}
