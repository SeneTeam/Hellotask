import {
  IsDateString,
  IsEnum,
  isEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaymentMethodForCustomers } from '../entities/payment.entity';

export class IpnBodyDto {
  // sample ipn body
  // {
  //   "txn_id": "Unique txn_id",
  //   "invoice_id": "abce-efg-hij-klm",
  //   "payment_method": "some enum value, e.g., bKash",
  //   "reference": "payment reference",
  //   "gateway_ipn_payload": {
  //       "key": "value",
  //       "another_key": "another value"
  //   },
  //   "payment_time": "2022-12-17T03:24:00",
  //   "payment_meta": {
  //       "key": "value",
  //       "mostly": "blank"
  //   }
  // }

  @IsString()
  @IsNotEmpty()
  txn_id: string;

  @IsString()
  @IsNotEmpty()
  invoice_id: string;

  @IsEnum(PaymentMethodForCustomers)
  @IsNotEmpty()
  payment_method: PaymentMethodForCustomers;

  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsDateString()
  @IsNotEmpty()
  payment_time: string;

  @IsObject()
  @IsNotEmpty()
  gateway_ipn_payload: object;

  @IsObject()
  @IsOptional()
  payment_meta?: object;
}
