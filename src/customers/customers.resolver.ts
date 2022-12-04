import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import {
  CreateCustomerAddressInput,
  DeleteCustomerAddressInput,
  FcmToken,
  UpdateCustomerAddressInput,
} from './dto/update-customer.input';
import { UpdateCustomerInput } from './dto/update-customer.input';
import { CurrentUser } from 'src/auth/gql.user.decorator';
import { Inject, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/gql.auth.guard';
import {
  AccessGuard,
  CaslConditions,
  ConditionsProxy,
  UseAbility,
} from 'nest-casl';
import { CustomerHook } from './customers.hook';
import { Actions } from 'src/app.actions';
import { CustomerAddress } from './entities/customer-address.entity';
import { CustomerAddressHook } from './customers.address.hook';
import { PaginateInput } from 'src/common/dto/paginate.input';
import { FinanceService } from 'src/finance/finance.service';
import {
  CustomerEwalletCreditInput,
  CustomerEwalletCreditResponse,
  CustomerEwalletDebitResponse,
} from './dto/ewallet-credit.dto';
import { CustomerEwalletDebitInput } from './dto/ewallet-debit.dto';

@Resolver(() => Customer)
export class CustomersResolver {
  constructor(
    private readonly customersService: CustomersService,
    @Inject(FinanceService)
    private readonly financeService: FinanceService,
  ) {}

  // createCustomer mutation
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.create, Customer)
  @Mutation(() => Customer, { name: 'createCustomer' })
  async createCustomer(
    @Args('longitude') longitude: number,
    @Args('latitude') latitude: number,
    @Args('phone_number', { nullable: true }) phone_number: string,
    @CurrentUser() user,
  ) {
    // console.log(phone_number);

    return await this.customersService.createCustomer(
      user,
      longitude,
      latitude,
      phone_number,
    );
  }

  // getCustomer query
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.read, Customer)
  @Query(() => Customer, { name: 'getCustomer' })
  async getCustomer(@CurrentUser() user) {
    return await this.customersService.getCustomer(user);
  }

  // getCustomerbyId query
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.readById, Customer, CustomerHook)
  @Query(() => Customer, { name: 'getCustomerById' })
  async getCustomerById(
    @Args('id')
    id: string,
    // @CurrentUser() user,
  ) {
    return await this.customersService.getCustomerById(id);
  }

  // get all customers query
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.readAll, Customer)
  @Query(() => [Customer], { name: 'getCustomers' })
  async getCustomers(
    @Args('paginate', { nullable: true, defaultValue: { skip: 0, take: 10 } })
    paginateInput: PaginateInput,
  ) {
    return await this.customersService.getCustomers(paginateInput);
  }

  // updateCustomer mutation
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.update, Customer, CustomerHook)
  @Mutation(() => Customer, { name: 'updateCustomer' })
  async updateCustomer(
    // @CurrentUser() user,
    // optional customer id arg
    @Args('id', { nullable: false }) id: string,
    @Args('updateCustomerInput', { nullable: true })
    updateCustomerInput: UpdateCustomerInput,
    @Args('createCustomerAddressInput', { nullable: true })
    createCustomerAddressInput: CreateCustomerAddressInput,
    @Args('updateCustomerAddressInput', { nullable: true })
    updateCustomerAddressInput: UpdateCustomerAddressInput,
    @Args('deleteCustomerAddressInput', { nullable: true })
    deleteCustomerAddressInput: DeleteCustomerAddressInput,
  ) {
    return await this.customersService.updateCustomer(
      id,
      updateCustomerInput,
      createCustomerAddressInput,
      updateCustomerAddressInput,
      deleteCustomerAddressInput,
    );
  }

  // deleteCustomerById mutation
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.delete, Customer, CustomerHook)
  @Mutation(() => Customer, { name: 'deleteCustomerById' })
  async deleteCustomerById(
    @Args('id', { nullable: false }) id: string,
    // @CurrentUser() user,
  ) {
    return await this.customersService.deleteCustomerById(id);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.create, Customer)
  @Mutation(() => CustomerEwalletCreditResponse, {
    name: 'customerEwalletCredit',
  })
  async customerEwalletCredit(
    @Args('customerEwalletCreditInput')
    customerEwalletCreditInput: CustomerEwalletCreditInput,
    @CurrentUser() user,
  ) {
    const _res = await this.financeService.customerEwalletCredit(
      user,
      customerEwalletCreditInput,
    );

    const customerCredit = new CustomerEwalletCreditResponse();
    customerCredit.transaction_id = _res.id;
    customerCredit.type = _res.type;
    customerCredit.amount = _res.amount;
    customerCredit.reference = _res.reference;

    return customerCredit;
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.create, Customer)
  @Mutation(() => CustomerEwalletDebitResponse, {
    name: 'customerEwalletDebit',
  })
  async customerEwalletDebit(
    @Args('customerEwalletDebitInput')
    customerEwalletDebitInput: CustomerEwalletDebitInput,
    @CurrentUser() user,
  ) {
    const res = await this.financeService.customerEwalletDebit(
      user,
      customerEwalletDebitInput,
    );

    const customerDebit = await new CustomerEwalletDebitResponse();
    customerDebit.transaction_id = res.id;
    customerDebit.type = res.type;
    customerDebit.amount = res.amount;
    customerDebit.reference = res.reference;

    return customerDebit;
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.update, Customer)
  @Mutation(() => FcmToken, { name: 'setFCMToken' })
  async setFCMToken(@Args('fcm_token') fcm_token: string, @CurrentUser() user) {
    return await this.customersService.setFCMToken(fcm_token, user);
  }
}
