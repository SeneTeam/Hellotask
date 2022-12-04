import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CaslModule } from 'nest-casl';
import { permissions } from './user.permission';

@Module({
  providers: [UsersResolver, UsersService],
  imports: [
    TypeOrmModule.forFeature([User]),
    CaslModule.forFeature({ permissions }),
  ],
  exports: [TypeOrmModule],
})
export class UsersModule {}
