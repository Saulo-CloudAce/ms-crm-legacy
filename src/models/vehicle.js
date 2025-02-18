const database = require("../config/database/database");

const maxQueryParams = 32767;
class Vehicle {
  async createOrUpdate(customerId, newVehicle) {
    try {
      const vehicle = await this.getByPlate(customerId, newVehicle.plate);

      if (vehicle) {
        await this.update(customerId, vehicle.id, newVehicle);
      } else {
        await this.create(customerId, newVehicle);
      }
    } catch (err) {
      return err;
    }
  }

  async create(customerId, newVehicle) {
    try {
      newVehicle.id_customer = customerId;
      await database("vehicle").insert(newVehicle);
    } catch (err) {
      return err;
    }
  }

  async update(customerId, vehicleId, vehicle) {
    try {
      const result = await database("vehicle")
        .update(vehicle, [
          "id",
          "plate",
          "model",
          "year",
          "renavam",
          "chassi",
          "license",
          "created_at",
          "updated_at",
        ])
        .where({ id_customer: customerId, id: vehicleId });
      return result[0];
    } catch (err) {
      return err;
    }
  }

  async getByPlate(customerId, plate) {
    try {
      const vehicle = await database("vehicle")
        .select(["id"])
        .where({ id_customer: customerId, plate });
      if (vehicle && vehicle.length > 0) return vehicle[0];
      return null;
    } catch (err) {
      return err;
    }
  }

  async getById(vehicleId = 0, customerId = 0) {
    try {
      const vehicle = await database("vehicle")
        .select([
          "id",
          "plate",
          "model",
          "year",
          "renavam",
          "chassi",
          "license",
          "created_at",
          "updated_at",
        ])
        .where({ id: vehicleId, id_customer: customerId });
      if (vehicle && vehicle.length > 0) return vehicle[0];
      return null;
    } catch (err) {
      return err;
    }
  }

  async getAllByCustomer(customerId) {
    try {
      const vehicles = await database("vehicle")
        .select([
          "id",
          "plate",
          "model",
          "year",
          "renavam",
          "chassi",
          "license",
          "created_at",
          "updated_at",
        ])
        .where({ id_customer: customerId })
        .orderBy("updated_at", "desc");
      return vehicles;
    } catch (err) {
      return err;
    }
  }

  async persistBatch(vehicleList = []) {
    if (vehicleList.length <= 0) return [];

    const maxVehicleByInsert = Math.floor(maxQueryParams / 10);

    try {
      const lastIndexVehicleList = vehicleList.length - 1;
      let chunkVehicleList = [];
      let numVehicle = 0;

      for (let indexVehicle in vehicleList) {
        const vehicle = vehicleList[indexVehicle];
        chunkVehicleList.push(vehicle);

        if (
          numVehicle === maxVehicleByInsert ||
          indexVehicle == lastIndexVehicleList
        ) {
          await database("vehicle").insert(chunkVehicleList);

          chunkVehicleList = [];
          numVehicle = 0;
        }

        numVehicle += 1;
      }
    } catch (err) {
      console.error(err);
      return err;
    }
  }

  async deleteByCustomerIdList(customerIdList = []) {
    try {
      await database("vehicle").whereIn("id_customer", customerIdList).del();
    } catch (err) {
      console.error(err);
      return err;
    }
  }
}

module.exports = Vehicle;
