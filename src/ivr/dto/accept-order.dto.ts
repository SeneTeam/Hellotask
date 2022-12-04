import { IsNotEmpty, IsNumber } from "class-validator";
import { IsNull } from "typeorm";
import { BaseIvrCallbackDto } from "./base-ivr-callback.dto";

export class AcceptOrderDto extends BaseIvrCallbackDto {
  @IsNotEmpty()
  @IsNumber()
  eta: number;
}