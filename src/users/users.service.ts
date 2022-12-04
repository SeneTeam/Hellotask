import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Args } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FirebaseAdminSDK,
  FIREBASE_ADMIN_INJECT,
} from '@tfarras/nestjs-firebase-admin';
import passport, { use } from 'passport';
import { PaginateInput } from 'src/common/dto/paginate.input';
import { Repository } from 'typeorm';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(FIREBASE_ADMIN_INJECT) private firebaseAdmin: FirebaseAdminSDK,
  ) {}

  async createUser(createUserInput: CreateUserInput) {
    const user = await this.userRepository.findOne({
      where: {
        email: createUserInput.email,
        deletedAt: null,
      },
    });

    if (user) {
      throw new HttpException('User already Exist', HttpStatus.BAD_REQUEST);
    }

    const firebaseResponse = await this.firebaseAdmin.auth().createUser({
      email: createUserInput.email,
      emailVerified: true,
      password: createUserInput.password,
      displayName: createUserInput.name,
      photoURL: createUserInput.photo_url,
      phoneNumber: createUserInput.phone_number,
    });

    const newUser = new User();
    newUser.firebaseUid = firebaseResponse ? firebaseResponse.uid : '';

    delete createUserInput.password;

    Object.assign(newUser, createUserInput);

    return await this.userRepository.save(newUser);
  }

  async getUser(user) {
    const userResponse = await this.userRepository.findOne({
      where: { id: user.id },
    });

    if (!userResponse) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return userResponse;
  }

  async getUsers(paginateInput: PaginateInput) {
    return await this.userRepository.find({
      withDeleted: true,
      skip: paginateInput.skip,
      take: paginateInput.take,
    });
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async updateUserById(id: string, updateUserInput: UpdateUserInput) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    Object.assign(user, updateUserInput);

    await this.firebaseAdmin.auth().updateUser(user.firebaseUid, {
      email: user.email,
      displayName: user.name,
      photoURL: user.photo_url,
      phoneNumber: user.phone_number,
    });

    if (updateUserInput.password) {
      await this.firebaseAdmin.auth().updateUser(user.firebaseUid, {
        password: updateUserInput.password,
      });
    }

    return await this.userRepository.save(user);
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const deleteResponse = await this.userRepository.softDelete(id);

    if (!deleteResponse.affected) {
      throw new HttpException(
        'Error deleting user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.firebaseAdmin.auth().updateUser(user.firebaseUid, {
      disabled: true,
    });

    return { id: id };
  }
}
