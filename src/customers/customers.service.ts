import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FirebaseAdminSDK,
  FIREBASE_ADMIN_INJECT,
} from '@tfarras/nestjs-firebase-admin';
import { lastValueFrom, map } from 'rxjs';
import { Roles } from 'src/app.roles';
import { PaginateInput } from 'src/common/dto/paginate.input';
import { Microarea } from 'src/locations/entities/microarea.entity';
import { LocationsService } from 'src/locations/locations.service';
import { Repository } from 'typeorm';
import { CustomerFactors } from './dto/customer-factors';
import {
  CreateCustomerAddressInput,
  DeleteCustomerAddressInput,
  UpdateCustomerAddressInput,
} from './dto/update-customer.input';
import { UpdateCustomerInput } from './dto/update-customer.input';
import { CustomerAddress } from './entities/customer-address.entity';
import { CustomerLocationLog } from './entities/customer-location-log';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomerAddress)
    private readonly customerAddressRepository: Repository<CustomerAddress>,
    @InjectRepository(CustomerLocationLog)
    private readonly customerLocationLogRepository: Repository<CustomerLocationLog>,
    @Inject(LocationsService)
    private readonly locationService: LocationsService,
    @Inject(FIREBASE_ADMIN_INJECT) private firebaseAdmin: FirebaseAdminSDK,
    private readonly httpService: HttpService,
  ) {}

  async getEwalletBalance(customerId: string) {
    // get url from the environment file
    const url =
      process.env.FINANCE_API_ENDPOINT + '/ewallet/balance/' + customerId;

    // get API key from the environment file
    const apiKey = process.env.FINANCE_API_KEY;

    // create header
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    };

    // send request to finance api
    const response = await this.httpService.get(url, { headers }).pipe(
      map((res) => {
        return res.data;
      }),
    );

    // convert obeservable to promise
    return await lastValueFrom(response)
      .then(async (res) => {
        return res.balance;
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  async getEwalletTransaction(customerId: string) {
    // get url from the environment file
    const url =
      process.env.FINANCE_API_ENDPOINT + '/ewallet/transactions/' + customerId;

    // get API key from the environment file
    const apiKey = process.env.FINANCE_API_KEY;

    // create header
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    };

    // send request to finance api
    const response = await this.httpService.get(url, { headers }).pipe(
      map((res) => {
        return res.data;
      }),
    );

    // convert obeservable to promise
    return await lastValueFrom(response)
      .then(async (res) => {
        return res;
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  // method to fetch work list for a microarea
  // TODO: Need to include proper microarea id
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getWorkforMicroarea(
    microarea: Microarea,
    customerId: string,
    customerFactors: CustomerFactors,
  ) {
    if (microarea.id === 1136) {
      return { works: [] };
    }
    // get url from the environment file
    const url = process.env.FINANCE_API_ENDPOINT + '/works/';
    // get API key from the environment file
    const apiKey = process.env.FINANCE_API_KEY;

    // create header
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    };

    const data = {
      customer: {
        id: customerId,
        factors: customerFactors,
      },
      microarea_details: {
        microarea_id: microarea.id,
        sourcing_zone_id: microarea.sourcingZoneId,
        zone_id: microarea.sourcingZone.zoneId,
      },
    };

    // send POST request to finance API
    const response = await this.httpService.post(url, data, { headers }).pipe(
      map((res) => {
        return res.data;
      }),
    );

    // convert obeservable to promise
    return await lastValueFrom(response)
      .then(async (res) => {
        return res;
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  async getLastLocation(customerId: string) {
    const customerLocationLog =
      await this.customerLocationLogRepository.findOne({
        where: { customer: { id: customerId } },
        order: { createdAt: 'DESC' },
      });
    return customerLocationLog.location;
  }

  async getLastLoginDate(firebaseUid: string) {
    const lastLoginDatestr: string = (
      await this.firebaseAdmin.auth().getUser(firebaseUid)
    ).metadata.lastSignInTime;
    return new Date(lastLoginDatestr);
  }

  async createCustomer(user, longitude, latitude, phone_number = null) {
    // console.log('createCustomer', user.roles);

    const customer = new Customer();

    // if user.roles  contain 'prospective_customer'
    if (user.roles.includes('prospective_customer')) {
      customer.phone_number = user.phone_number;
      customer.firebaseUid = user.uid;
      customer.roles = [Roles.customer];
    } else {
      // if phoine_number is null then through bad request exception
      if (!phone_number) {
        throw new HttpException(
          'Phone number is required for creating customer',
          HttpStatus.BAD_REQUEST,
        );
      }
      customer.phone_number = phone_number;
      // TODO: create a new firebase user
      const firebaseUser = await this.firebaseAdmin.auth().createUser({
        phoneNumber: phone_number,
      });
      // console.log('firebaseUser', firebaseUser);
      customer.firebaseUid = firebaseUser.uid;
    }

    const saved_customer = await this.customerRepository.save(customer);

    const customer_location_log = new CustomerLocationLog();
    customer_location_log.customer = saved_customer;

    const pointObj = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };
    customer_location_log.location = pointObj;

    await this.customerLocationLogRepository.save(customer_location_log);
    saved_customer.lastLocation = await this.getLastLocation(saved_customer.id);
    // saved_customer.lastLoginDate = await this.getLastLoginDate(
    //   saved_customer.firebaseUid,
    // );
    return saved_customer;
  }

  async getCustomer(user: Customer) {
    const customer = await this.customerRepository.findOne({
      where: { id: user.id, isBanned: false },
      relations: {
        customer_addresses: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!customer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }

    // add e-wallet balance to customer
    customer.walletBalance = await this.getEwalletBalance(user.id);
    // add e-wallet transactions to customer
    customer.transactionHistory = await this.getEwalletTransaction(user.id);

    customer.lastLocation = await this.getLastLocation(user.id);
    // customer.lastLoginDate = await this.getLastLoginDate(user.firebaseUid);

    // loop through customer addresses and get microareas
    for (const address of customer.customer_addresses) {
      // extract latitude and longitude from address location
      const [longitude, latitude] = address.location.coordinates;
      // get microareas from longitude and latitude
      const microareas: Microarea[] =
        await this.locationService.resolveLocation(longitude, latitude);
      // fetch works for microareas
      address.microarea = microareas[0];
      // get default address for customer
      address.works = await this.getWorkforMicroarea(
        microareas[0],
        customer.id,
        await this.getCustomerFactors(address.id),
      );
    }

    return customer;
  }

  async getCustomerById(id: string) {
    const customer = await this.customerRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: {
        customer_addresses: true,
      },
    });

    if (!customer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }

    customer.lastLocation = await this.getLastLocation(id);

    // resolve customer addresses
    for (const address of customer.customer_addresses) {
      // extract latitude and longitude from address location
      const [longitude, latitude] = address.location.coordinates;
      // get microareas from longitude and latitude
      const microareas: Microarea[] =
        await this.locationService.resolveLocation(longitude, latitude);
      address.microarea = microareas[0];
      // fetch works for microareas
      address.works = await this.getWorkforMicroarea(
        microareas[0],
        customer.id,
        await this.getCustomerFactors(address.id),
      );
    }

    // add e-wallet balance to customer
    customer.walletBalance = await this.getEwalletBalance(id);

    // add e-wallet transactions to customer
    customer.transactionHistory = await this.getEwalletTransaction(id);

    // customer.lastLoginDate = await this.getLastLoginDate(customer.firebaseUid);
    return customer;
  }

  async getCustomers(paginateInput: PaginateInput) {
    const customers: Customer[] = await this.customerRepository.find({
      skip: paginateInput.skip,
      take: paginateInput.take,
      withDeleted: true,
      relations: {
        customer_addresses: true,
      },
    });

    // get last location of each customer
    for (const customer of customers) {
      // add e-wallet balance to customer
      customer.walletBalance = await this.getEwalletBalance(customer.id);
      // add e-wallet transactions to customer
      customer.transactionHistory = await this.getEwalletTransaction(
        customer.id,
      );

      customer.lastLocation = await this.getLastLocation(customer.id);

      for (const address of customer.customer_addresses) {
        // extract latitude and longitude from address location
        const [longitude, latitude] = address.location.coordinates;
        // get microareas from longitude and latitude
        const microareas: Microarea[] =
          await this.locationService.resolveLocation(longitude, latitude);
        address.microarea = microareas[0];
        // fetch works for microareas
        address.works = await this.getWorkforMicroarea(
          microareas[0],
          customer.id,
          await this.getCustomerFactors(address.id),
        );
      }
    }
    return customers;
  }

  // method to update customer along with customer address
  async updateCustomer(
    id: string,
    updateCustomerInput: UpdateCustomerInput,
    createCustomerAddressInput: CreateCustomerAddressInput,
    updateCustomerAddressInput: UpdateCustomerAddressInput,
    deleteCustomerAddressInput: DeleteCustomerAddressInput,
  ) {
    // check if customer exists
    const customer = await this.customerRepository.findOne({
      where: { id },
    });
    if (!customer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }

    // if upfateCustomerInput is not empty
    if (updateCustomerInput) {
      // if updateCustomerInput contants longitude and latitude, then update customer location
      if (updateCustomerInput.longitude && updateCustomerInput.latitude) {
        const customer_location_log = new CustomerLocationLog();
        customer_location_log.customer = customer;

        const pointObj = {
          type: 'Point',
          coordinates: [
            updateCustomerInput.longitude,
            updateCustomerInput.latitude,
          ],
        };
        customer_location_log.location = pointObj;

        await this.customerLocationLogRepository.save(customer_location_log);
        // remove longitude and latitude from updateCustomerInput
        delete updateCustomerInput.longitude;
        delete updateCustomerInput.latitude;
      }

      // assign updateCustomerInput to customer
      Object.assign(customer, updateCustomerInput);
      // save customer
      await this.customerRepository.save(customer);
    }

    // if createCustomerAddressInput is not empty
    if (createCustomerAddressInput) {
      const customerAddress = new CustomerAddress();

      // check if this customer has any address
      const customerAddressCount = await this.customerAddressRepository.count({
        where: { customerId: id },
      });

      if (customerAddressCount > 0) {
        // set is_default to false to all other addresses
        await this.customerAddressRepository.update(
          { customerId: id },
          { is_default: false },
        );
      }

      customerAddress.location = await this.validateCustomerAddressCooridnates(
        createCustomerAddressInput.longitude,
        createCustomerAddressInput.latitude,
      );

      delete createCustomerAddressInput.longitude;
      delete createCustomerAddressInput.latitude;

      // assign createCustomerAddressInput to customerAddress
      Object.assign(customerAddress, createCustomerAddressInput);

      // assign customer to customerAddress
      customerAddress.customer = customer;
      // set is_default to true to this address
      customerAddress.is_default = true;
      // save customerAddress
      await this.customerAddressRepository.save(customerAddress);
    }

    // if updateCustomerAddressInput is not empty
    if (updateCustomerAddressInput) {
      // check if customer address exists
      const customerAddress = await this.customerAddressRepository.findOne({
        where: {
          id: updateCustomerAddressInput.id,
          customerId: id,
        },
      });
      if (!customerAddress) {
        throw new HttpException(
          'Customer address not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (
        updateCustomerAddressInput.longitude &&
        updateCustomerAddressInput.latitude
      ) {
        customerAddress.location =
          await this.validateCustomerAddressCooridnates(
            updateCustomerAddressInput.longitude,
            updateCustomerAddressInput.latitude,
          );

        delete updateCustomerAddressInput.longitude;
        delete updateCustomerAddressInput.latitude;
      }

      // if updateCustomerAddressInput sets is_default to true, then set all other customer addresses to false
      if (updateCustomerAddressInput.is_default === true) {
        // set all other addresses to false
        await this.customerAddressRepository.update(
          { customerId: id },
          { is_default: false },
        );

        // set this address to true
        customerAddress.is_default = true;
        delete updateCustomerAddressInput.is_default;
      }

      // assign updateCustomerAddressInput to customer address
      Object.assign(customerAddress, updateCustomerAddressInput);
      // save customer address
      await this.customerAddressRepository.save(customerAddress);
    }

    // if deleteCustomerAddressInput is not empty
    if (deleteCustomerAddressInput) {
      // check if customer address exists
      const customerAddress = await this.customerAddressRepository.findOne({
        where: {
          id: deleteCustomerAddressInput.customerAddressId,
        },
      });
      if (!customerAddress) {
        throw new HttpException(
          'Customer address not found',
          HttpStatus.NOT_FOUND,
        );
      }

      // soft delete customer address
      const deletedResponse = await this.customerAddressRepository.softDelete(
        deleteCustomerAddressInput.customerAddressId,
      );
      if (!deletedResponse.affected) {
        throw new HttpException(
          'Could not delete customer address',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // get customer from database
    const updatedCustomer = await this.customerRepository.findOne({
      where: { id },
      relations: {
        customer_addresses: true,
      },
    });
    // get last location of customer
    updatedCustomer.lastLocation = await this.getLastLocation(id);
    // updatedCustomer.lastLoginDate = await this.getLastLoginDate(
    //   updatedCustomer.firebaseUid,
    // );
    return updatedCustomer;
  }

  // This method is used by a hook
  async getCustomerAddressById(id: string) {
    const customerAddress = await this.customerAddressRepository.findOne({
      where: { id },
    });
    if (!customerAddress) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }
    return customerAddress;
  }

  async deleteCustomerById(id: string) {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });
    if (!customer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }
    // get last location of customer
    customer.lastLocation = await this.getLastLocation(id);
    // customer.lastLoginDate = await this.getLastLoginDate(customer.firebaseUid);

    // await this.customerRepository.delete(id);
    await this.customerRepository.softDelete(id);
    return customer;
  }

  async validateCustomerAddressCooridnates(
    longitude: number,
    latitude: number,
  ) {
    const pointObj = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };
    // check if coordinates can be resolved to a microarea
    // const microareas: Microarea[] = await this.locationService.resolveLocation(
    //   longitude,
    //   latitude,
    // );
    // if (microareas.length === 0) {
    //   throw new HttpException(
    //     'Invalid coordinates, please enter valid coordinates',
    //     HttpStatus.BAD_REQUEST,
    //   );
    // }
    return pointObj;
  }

  async getCustomerFactors(
    customerAddressId: string,
  ): Promise<CustomerFactors> {
    const customerAddress = await this.customerAddressRepository.findOne({
      where: { id: customerAddressId },
      withDeleted: true,
    });

    if (!customerAddress) {
      throw new HttpException(
        'Customer address not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const customerFactors: CustomerFactors = new CustomerFactors();
    customerFactors.house_size = Number(customerAddress.appartment_size);
    // Prince bhai said, there is no house in the entire universe with more than 1 drawingroom.
    // So, no_of_drawing_rooms = 1
    // and, no_of_rooms = no_of_total_rooms - no_of_drawing_rooms
    // no one deletes this comment.
    // ~ Sayom Shakib
    customerFactors.drawingrooms = 1;
    customerFactors.bedrooms = customerAddress.no_of_rooms - 1;
    customerFactors.belcony = customerAddress.no_of_balcony;
    // Prince bhai said there is no home in the entire universe with more than 1 kitchen.
    customerFactors.kitchen = 1;
    customerFactors.washrooms = customerAddress.no_of_bathrooms;
    customerFactors.adults = customerAddress.no_of_adults;
    customerFactors.child = customerAddress.no_of_children;

    return customerFactors;
  }

  async getMicroareaDetailsByCustomerAddressId(customerAddressId: string) {
    const customerAddress = await this.customerAddressRepository.findOne({
      where: { id: customerAddressId },
    });
    if (!customerAddress) {
      throw new HttpException(
        'Customer address not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const microarea = await this.locationService.resolveLocation(
      customerAddress.location.coordinates[0],
      customerAddress.location.coordinates[1],
    );
    return {
      microarea_id: microarea[0].id,
      sourcing_zone_id: microarea[0].sourcingZoneId,
      zone_id: microarea[0].sourcingZone.zoneId,
    };
  }

  async readAddress(customerAddressId: string) {
    const customerAddress = await this.customerAddressRepository.findOne({
      where: { id: customerAddressId },
    });
    var address: string =
      'বাসা নম্বর ' +
      customerAddress.house +
      '। রোড নম্বর ' +
      customerAddress.road;
    customerAddress.block
      ? (address += '। ব্লক নম্বর ' + customerAddress.block)
      : '';
    customerAddress.sector
      ? (address += '। সেক্টর নম্বর ' + customerAddress.sector)
      : '';
    customerAddress.socity ? (address += customerAddress.socity) : '';
    customerAddress.moholla
      ? (address += customerAddress.moholla + '। এলাকা')
      : '';
    // customerAddress.building_color ? address += "বিল্ডিং রং " + customerAddress.building_color : "";

    customerAddress.lift
      ? (address +=
          '। লিফটের ' +
          customerAddress.lift +
          ', এ উঠে' +
          customerAddress.flat +
          ', নম্বর ফ্ল্যাটে।')
      : '';
    customerAddress.stair && !customerAddress.lift
      ? (address +=
          '। সিঁড়ির ' +
          customerAddress.stair +
          ', তলায় উঠে' +
          customerAddress.flat +
          ', নম্বর ফ্ল্যাটে।')
      : '';
    customerAddress.stair && customerAddress.lift
      ? (address +=
          '। অথবা সিঁড়ি দিয়ে,  ' + customerAddress.stair + ', তলায় উঠবেন')
      : '';

    return address;
  }

  async setFCMToken(fcmToken: string, user: Customer) {
    const customer = await this.customerRepository.findOne({
      where: { id: user.id },
    });
    if (!customer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }
    customer.fcm_token = fcmToken;
    await this.customerRepository.save(customer);
    return {
      response: 'token successfully set',
    };
  }
}
