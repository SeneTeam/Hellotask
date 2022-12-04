import { IsEmpty, IsNotEmpty, IsNumber } from "class-validator";
import { IsNull } from "typeorm";

export class BaseIvrCallbackDto {
  @IsNotEmpty()
  callId: string;

  @IsNotEmpty()
  order_id: string;

  @IsNotEmpty()
  worker_id: string;

  @IsNotEmpty()
  worker_phone: string;
}