import {
  InputType,
  Int,
  Field,
  PartialType,
  ObjectType,
} from '@nestjs/graphql';

@InputType()
export class CreateCustomerAddressInput {
  // address field
  @Field(() => String, {
    description: 'Address label of the Customer',
    nullable: false,
  })
  address_label: string;

  // longitude column field
  @Field(() => Number, {
    description: 'Longitude of the Customer',
  })
  longitude: number;

  // latitude column field
  @Field(() => Number, {
    description: 'Latitude of the Customer',
  })
  latitude: number;

  // socity field
  @Field(() => String, {
    description: 'Socity of the Customer',
    nullable: true,
  })
  socity: string;

  // sector field
  @Field(() => String, {
    description: 'Sector of the Customer',
    nullable: true,
  })
  sector: string;

  // moholla field
  @Field(() => String, {
    description: 'Moholla of the Customer',
    nullable: true,
  })
  moholla: string;

  // block field
  @Field(() => String, {
    description: 'Block of the Customer',
    nullable: true,
  })
  block: string;

  // road field
  @Field(() => String, {
    description: 'Road of the Customer',
    nullable: true,
  })
  road: string;

  // house field
  @Field(() => String, {
    description: 'House of the Customer',
    nullable: true,
  })
  house: string;

  // lift field
  @Field(() => String, {
    description: 'Lift of the Customer',
    nullable: true,
  })
  lift: string;

  // stair field
  @Field(() => String, {
    description: 'Stair of the Customer',
    nullable: true,
  })
  stair: string;

  // flat field
  @Field(() => String, {
    description: 'Flat of the Customer',
    nullable: true,
  })
  flat: string;

  // landmark field
  @Field(() => String, {
    description: 'Landmark of the Customer',
    nullable: true,
  })
  landmark: string;

  // building field
  @Field(() => String, {
    description: 'Building color of the Customer',
    nullable: true,
  })
  building_color: string;

  // // default addess field
  // @Field(() => Boolean, {
  //   description: 'Default address of the Customer',
  //   nullable: true,
  // })
  // is_default: boolean;

  // appartment type field
  @Field(() => String, {
    description: 'Appartment type of the Customer',
    nullable: true,
  })
  appartment_type: string;

  // appartment size field
  @Field(() => String, {
    description: 'Appartment size of the Customer',
    nullable: true,
  })
  appartment_size: string;

  // number of rooms field
  @Field(() => Int, {
    description: 'Number of rooms of the Customer',
    nullable: true,
  })
  no_of_rooms: number;

  // number of bathrooms field
  @Field(() => Int, {
    description: 'Number of bathrooms of the Customer',
    nullable: true,
  })
  no_of_bathrooms: number;

  // number of balcony field
  @Field(() => Int, {
    description: 'Number of balcony of the Customer',
    nullable: true,
  })
  no_of_balcony: number;

  // number of adult person field
  @Field(() => Int, {
    description: 'Number of adult person of the Customer',
    nullable: true,
  })
  no_of_adults: number;

  // number of child field
  @Field(() => Int, {
    description: 'Number of children of the Customer',
    nullable: true,
  })
  no_of_children: number;

  // number of pets field
  @Field(() => Int, {
    description: 'Number of pets of the Customer',
    nullable: true,
  })
  no_of_pets: number;

  // number of permanent maids field
  @Field(() => Int, {
    description: 'Number of permanent maids of the Customer',
    nullable: true,
  })
  no_of_permanent_maids: number;

  // last verified date
  @Field(() => Date, {
    description: 'Last verified date of the Customer',
    nullable: true,
  })
  last_verified_date: Date;
}

@InputType()
export class UpdateCustomerAddressInput extends PartialType(
  CreateCustomerAddressInput,
) {
  @Field(() => String, {
    description: 'ID of the Customer address',
    nullable: true,
  })
  id: string;

  // default addess field
  @Field(() => Boolean, {
    description: 'Default address of the Customer',
    nullable: true,
  })
  is_default: boolean;

  // // Redeclaring the following properties to make it mandatory
  // @Field(() => String, {
  //   description: 'Address label of the Customer',
  //   nullable: false,
  // })
  // address_label: string;

  // // longitude column field
  // @Field(() => Number, {
  //   description: 'Longitude of the Customer',
  //   nullable: false,
  // })
  // longitude: number;

  // // latitude column field
  // @Field(() => Number, {
  //   description: 'Latitude of the Customer',
  //   nullable: false,
  // })
  // latitude: number;
}

@InputType()
export class UpdateCustomerInput {
  @Field(() => String, {
    description: 'Name of the Customer',
    nullable: true,
  })
  name: string;

  // photo url column field
  @Field(() => String, {
    description: 'Photo url of the Customer',
    nullable: true,
  })
  photo_url: string;

  // email column field
  @Field(() => String, {
    description: 'Email of the Customer',
    nullable: true,
  })
  email: string;

  // longitude column field
  @Field(() => Number, {
    description: 'Longitude of the Customer',
    nullable: true,
  })
  longitude: number;

  // latitude column field
  @Field(() => Number, {
    description: 'Latitude of the Customer',
    nullable: true,
  })
  latitude: number;
}

@InputType()
export class DeleteCustomerAddressInput {
  @Field(() => String, {
    description: 'ID of the Customer address',
    nullable: true,
  })
  customerAddressId: string;
}

@ObjectType()
export class FcmToken {
  @Field(() => String, {
    description: 'FCM token set response',
    nullable: true,
  })
  response: string;
}
