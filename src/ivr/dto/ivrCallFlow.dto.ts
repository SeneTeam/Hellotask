import { PartialType } from '@nestjs/mapped-types';
import {
  isBoolean,
  isEmpty,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { IvrCallTypes } from '../ivr-call-types.enum';

export class CreateIvrCallFlowDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(IvrCallTypes)
  callType: IvrCallTypes;

  @IsNotEmpty()
  @IsString()
  callFlowJson: string;
}

export class UpdateIvrCallFlowDto extends PartialType(CreateIvrCallFlowDto) {
  deactivate?: boolean;
}
