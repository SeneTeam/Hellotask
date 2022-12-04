import { CreatePackageInput } from './create-package.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdatePackageInput extends PartialType(CreatePackageInput) {}
