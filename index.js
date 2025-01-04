const axios = require('axios');
const { API } = require('homebridge');

// Create an Axios instance with a timeout of 10 seconds
const axiosInstance = axios.create({
  timeout: 10000, // 10 seconds
});

module.exports = (homebridge) => {
  homebridge.registerAccessory(
    'homebridge-systemair-ventilator',
    'SystemairVentilator',
    SystemairVentilator
  );
};

class SystemairVentilator {
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;

    // Fan service
    this.fanService = new this.api.hap.Service.Fanv2(this.config.name + " Fan");

    this.setupCharacteristics();
  }

  setupCharacteristics() {
    // Fan characteristics
    this.fanService
      .getCharacteristic(this.api.hap.Characteristic.Active)
      .on('set', this.setActive.bind(this))
      .on('get', this.getActive.bind(this));

    this.fanService
      .getCharacteristic(this.api.hap.Characteristic.RotationSpeed)
      .on('set', this.setRotationSpeed.bind(this))
      .on('get', this.getRotationSpeed.bind(this));
  }

  async retryRequest(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await axiosInstance.get(url);
      } catch (error) {
        if (i === retries - 1) {
          this.log(`Retry failed: ${error.message}`);
          throw error;
        }
        this.log(`Retrying request (${i + 1}/${retries}) due to: ${error.message}`);
        await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay before retry
      }
    }
  }

  async setActive(value, callback) {
    const url = `http://${this.config.ip}/mwrite?{"1130":${value ? '1' : '0'}}`;
    this.log(`SetActive: Sending request to ${url}`);
    try {
      await this.retryRequest(url);
      this.log(`SetActive: Successfully set to ${value ? 'ON' : 'OFF'}`);
      callback(null);
    } catch (error) {
      this.log(`SetActive: Error - ${error.message}`);
      callback(error);
    }
  }

  async getActive(callback) {
    const url = `http://${this.config.ip}/mread?{"1130":1}`;
    this.log(`GetActive: Sending request to ${url}`);
    try {
      const response = await this.retryRequest(url);
      const isActive = response.data["1130"] > 0; // Active if speed is 1, 2, or 3
      this.log(`GetActive: Current state is ${isActive ? 'ON' : 'OFF'}`);
      callback(null, isActive ? 1 : 0);
    } catch (error) {
      this.log(`GetActive: Error - ${error.message}`);
      callback(error);
    }
  }

  async setRotationSpeed(value, callback) {
      let url;

      if (value === 0) {
          // Off
          url = `http://${this.config.ip}/mwrite?{"1130":0,"1161":0,"2000":0,"2504":0,"16100":0}`;
          this.log(`SetRotationSpeed: Turning off (value: ${value}%)`);
      } else if (value <= 16) {
          // Low speed
          url = `http://${this.config.ip}/mwrite?{"1130":2,"1161":2,"2000":180,"2504":0,"16100":0}`;
          this.log(`SetRotationSpeed: Setting to Low (value: ${value}%)`);
      } else if (value <= 50) {
          // Normal speed
          url = `http://${this.config.ip}/mwrite?{"1130":3,"1161":2,"2000":180,"2504":0,"16100":0}`;
          this.log(`SetRotationSpeed: Setting to Normal (value: ${value}%)`);
      } else if (value <= 83) {
          // High speed
          url = `http://${this.config.ip}/mwrite?{"1130":4,"1161":2,"2000":180,"2504":0,"16100":0}`;
          this.log(`SetRotationSpeed: Setting to High (value: ${value}%)`);
      } else {
          // Treat any value above 83% as High
          url = `http://${this.config.ip}/mwrite?{"1130":4,"1161":2,"2000":180,"2504":0,"16100":0}`;
          this.log(`SetRotationSpeed: Setting to High (value: ${value}%)`);
      }

      try {
          await this.retryRequest(url);
          this.log(`SetRotationSpeed: Successfully set to speed (value: ${value}%)`);
          callback(null);
      } catch (error) {
          this.log(`SetRotationSpeed: Error - ${error.message}`);
          callback(error);
      }
  }


  async getRotationSpeed(callback) {
    const url = `http://${this.config.ip}/mread?{"1130":1}`;
    this.log(`GetRotationSpeed: Sending request to ${url}`);
    try {
      const response = await this.retryRequest(url);
      const speed = response.data["1130"]; // Extract the speed value
      let percentage;

      if (speed === 2) {
        percentage = 16; // Low
      } else if (speed === 3) {
        percentage = 50; // Normal
      } else if (speed === 4) {
        percentage = 83; // High
      } else {
        percentage = 0; // Off or unknown value
      }

      this.log(`GetRotationSpeed: Current speed is ${speed} (value: ${percentage}%)`);
      callback(null, percentage);
    } catch (error) {
      this.log(`GetRotationSpeed: Error - ${error.message}`);
      callback(error);
    }
  }

  getServices() {
    return [this.fanService];
  }
}
	
