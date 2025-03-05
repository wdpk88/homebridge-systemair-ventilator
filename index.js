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

    // Add a Refresh service
    this.refreshService = new this.api.hap.Service.Switch(this.config.name + " Refresh");

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

    // Refresh characteristic
    this.refreshService
      .getCharacteristic(this.api.hap.Characteristic.On)
      .on('set', this.setRefresh.bind(this));
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

  async setRefresh(value, callback) {
    if (value) {
      const writeUrl = `http://${this.config.ip}/mwrite?{"1130":2,"1161":4,"2000":180,"2504":0,"16100":0}`;
      this.log(`Refresh: Sending request to ${writeUrl}`);
      try {
        const response = await this.retryRequest(writeUrl);
        this.log(`Refresh: Successfully started refresh mode (custom settings).`);
        // Automatically turn off the switch after initiating refresh
        setTimeout(() => {
          this.refreshService
            .getCharacteristic(this.api.hap.Characteristic.On)
            .updateValue(false);
       }, 1000);
        callback(null);
      } catch (error) {
        this.log(`Refresh: Error - ${error.message}`);
        callback(error);
      }
    } else {
      this.log(`Refresh: Turned off manually.`);
      callback(null);
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
    let speed;
    if (value === 0) {
      speed = 0; // Off
    } else if (value <= 16) {
      speed = 2; // Low
    } else if (value <= 50) {
      speed = 3; // Normal
    } else {
      speed = 4; // High
    }

    const url = `http://${this.config.ip}/mwrite?{"1130":${speed}}`;
    this.log(`SetRotationSpeed: Setting speed to ${speed} (value: ${value}%)`);
    try {
      await this.retryRequest(url);
      this.log(`SetRotationSpeed: Successfully set to speed ${speed}`);
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
      const speed = response.data["1130"];
      let percentage;

      if (speed === 2) {
        percentage = 16; // Low
      } else if (speed === 3) {
        percentage = 50; // Normal
      } else if (speed === 4) {
        percentage = 83; // High
      } else {
        percentage = 0; // Off
      }

      this.log(`GetRotationSpeed: Current speed is ${speed} (value: ${percentage}%)`);
      callback(null, percentage);
    } catch (error) {
      this.log(`GetRotationSpeed: Error - ${error.message}`);
      callback(error);
    }
  }

  getServices() {
    return [this.fanService, this.refreshService];
  }
}

	
