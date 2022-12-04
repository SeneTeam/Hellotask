import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LocationsModule } from './locations/locations.module';
import { WorkersModule } from './workers/workers.module';
import { CustomersModule } from './customers/customers.module';
import GraphQLJSON from 'graphql-type-json';
import { DataSource } from 'typeorm';
import { FirebaseAdminModule } from '@tfarras/nestjs-firebase-admin';
import * as admin from 'firebase-admin';

// imports the service account key JSON file
import serviceAccount from '../keys/firebase/hellotask-v3-firebase-adminsdk-2xczh-0ef7629d96.json';
import { AuthModule } from './auth/auth.module';
import { CaslModule } from 'nest-casl';
import { Roles } from './app.roles';
import { UsersModule } from './users/users.module';
import { PackagesModule } from './packages/packages.module';
import { OrdersModule } from './orders/orders.module';
import { IvrModule } from './ivr/ivr.module';
import { BullModule } from '@nestjs/bull';
import { TaskModule } from './task/task.module';
import { FinanceModule } from './finance/finance.module';
import { PubSub } from 'graphql-subscriptions';
import { PubSubModule } from './pub-sub/pub-sub.module';
import { NotificationModule } from './notification/notification.module';

const transformedServiceAccount = {};

Object.keys(serviceAccount).forEach((key) => {
  // transform the keys from snake case to camelCase
  transformedServiceAccount[key.replace(/(_\w)/g, (m) => m[1].toUpperCase())] =
    serviceAccount[key];
});

@Module({
  imports: [
    // Config module
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // TypeORM modules
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (ConfigService: ConfigService) => ({
        type: 'postgres',
        host: ConfigService.get('POSTGRES_DB_HOST'),
        port: ConfigService.get('POSTGRES_DB_PORT'),
        username: ConfigService.get('POSTGRES_USER'),
        password: ConfigService.get('POSTGRES_PASSWORD'),
        database: ConfigService.get('POSTGRES_DB'),
        autoLoadEntities: true,
        synchronize: true,
        ssl: true
        // logging: true,
      }),
      inject: [ConfigService],
    }),

    // TypeORM module for mongo DB
    TypeOrmModule.forRootAsync({
      name: 'mongo',
      imports: [ConfigModule],
      useFactory: (ConfigService: ConfigService) => ({
        type: 'mongodb',
        url: ConfigService.get('MONGODB_URI'),
        // host: ConfigService.get('MONGODB_HOST'),
        // port: ConfigService.get('MONGODB_PORT'),
        //database: ConfigService.get('MONGODB_DATABASE'),
        database: 'hellotask-ivr',
        // authMechanism: 'DEFAULT',
        authSource: 'admin',
        autoLoadEntities: true,
        useNewUrlParser: true,
        synchronize: false,
        //logging: true,
      }),
      inject: [ConfigService],
    }),

    // graphql module
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
      // autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      autoSchemaFile: true,
      debug: true,
      playground: true,
      include: [
        LocationsModule,
        WorkersModule,
        CustomersModule,
        UsersModule,
        PackagesModule,
        OrdersModule,
        TaskModule,
      ],
      resolvers: [{ JSON: GraphQLJSON }],
    }),

    FirebaseAdminModule.forRootAsync({
      useFactory: () => ({
        // initialize firebase admin with the service account key
        credential: admin.credential.cert(transformedServiceAccount),
      }),
    }),

    CaslModule.forRoot<Roles>({
      superuserRole: Roles.admin,
      getUserFromRequest(request) {
        return request.user;
      },
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: +configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),

    // LoggerModule.forRoot(),

    AuthModule,

    LocationsModule,

    WorkersModule,

    CustomersModule,

    CaslModule,

    UsersModule,

    PackagesModule,

    OrdersModule,

    IvrModule,

    TaskModule,

    FinanceModule,

    PubSubModule,

    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
