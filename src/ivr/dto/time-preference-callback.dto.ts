import { IsEmpty, IsNotEmpty, IsNumber } from "class-validator";
import { IsNull } from "typeorm";

export class TimePreferenceIvrCallbackDto {

  // @IsNotEmpty()
  callId: string;
  // @IsNotEmpty()
  worker_id?: any;

  // @IsNotEmpty()
  is_agreed?: any;

  // @IsEmpty()
  working_time?: any;
}