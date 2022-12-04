import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from 'src/customers/entities/customer.entity';
import { User } from 'src/users/entities/user.entity';
import { HeaderApiKeyStrategy } from './auth-header-api-key.strategy';
import { FirebaseStrategy } from './firebase.strategy';
import { GqlAuthGuard } from './gql.auth.guard';

@Module({
  imports: [PassportModule, TypeOrmModule.forFeature([Customer, User])],
  providers: [FirebaseStrategy, GqlAuthGuard, HeaderApiKeyStrategy],
  exports: [FirebaseStrategy, GqlAuthGuard],
  controllers: [],
})
export class AuthModule {}
