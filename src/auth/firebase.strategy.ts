import {
  ContextType,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FirebaseAuthStrategy,
  FirebaseUser,
} from '@tfarras/nestjs-firebase-auth';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ExtractJwt } from 'passport-jwt';
import { ParsedQs } from 'qs';
import { Roles } from 'src/app.roles';
import { Customer } from 'src/customers/entities/customer.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FirebaseStrategy extends PassportStrategy(
  FirebaseAuthStrategy,
  'firebase',
) {
  public constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      extractor: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: FirebaseUser) /* : Promise<FirebaseUser> */ {
    // Do here whatever you want and return your user
    // console.log('validate', payload);

    if (payload.firebase.sign_in_provider === 'phone') {
      const customer: Customer = await this.customerRepository.findOne({
        where: {
          phone_number: payload.phone_number,
          firebaseUid: payload.uid,
        },
      });
      if (!customer) {
        // throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        const prospective_customer = {
          ...payload,
          id: payload.uid,
          roles: [Roles.prospective_customer],
        };
        //console.log('customer', customer);
        return prospective_customer;
      }
      // console.log('customer', customer);
      return customer;
    } else {
      // check user roles
      const user: User = await this.userRepository.findOne({
        where: {
          firebaseUid: payload.uid,
        },
      });
      // console.log('user', user);
      return user;
    }
  }
}
