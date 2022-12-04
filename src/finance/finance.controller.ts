import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { Args } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { AccessGuard, UseAbility } from 'nest-casl';
import { Actions } from '../app.actions';
import { GqlAuthGuard } from '../auth/gql.auth.guard';
import { Estimate } from '../orders/entities/estimate.entity';
import { IpnBodyDto } from './dto/ipn-body.dto';
import { Payment, PaymentMethodForCustomers } from './entities/payment.entity';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('/payment')
  @UseGuards(AuthGuard('ipn-api-key'))
  async create(@Body() ipnBodyDto: IpnBodyDto) {
    return await this.financeService.receivePayment(ipnBodyDto);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.createEstimate, Estimate)
  @Post('/get-estimate-overtime/:order_id')
  async getEstimateOvertime(@Param('order_id') order_id: string) {
    return await this.financeService.getEstimateOvertime(order_id);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.createPayment, Payment)
  @Post('/get-payment-overtime/:order_id/:payment_method')
  async getPaymentOvertime(
    @Param('order_id') order_id: string,
    @Param('payment_method') payment_method: PaymentMethodForCustomers,
  ) {
    return await this.financeService.createPaymentOvertime(
      order_id,
      payment_method,
    );
  }

  // @Get()
  // findAll() {
  //   return this.financeService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.financeService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateFinanceDto: UpdateFinanceDto) {
  //   return this.financeService.update(+id, updateFinanceDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.financeService.remove(+id);
  // }
}
