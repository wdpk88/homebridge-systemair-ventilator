const axios = require('axios');
const { API } = require('homebridge');

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

    // Fan and Thermostat services
    this.fanService = new this.api.hap.Service.Fanv2(this.config.name + " Fan");
    this.thermostatService = new this.api.hap.Service.Thermostat(this.config.name + " Thermostat");

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

    // Thermostat characteristics
    this.thermostatService
      .getCharacteristic(this.api.hap.Characteristic.CurrentTemperature)
      .on('get', this.getCurrentTemperature.bind(this));

    this.thermostatService
      .getCharacteristic(this.api.hap.Characteristic.TargetTemperature)
      .setProps({
        minValue: 12,
        maxValue: 30,
        minStep: 1,
      })
      .on('set', this.setTargetTemperature.bind(this))
      .on('get', this.getTargetTemperature.bind(this));

    this.thermostatService
      .getCharacteristic(this.api.hap.Characteristic.TemperatureDisplayUnits)
      .on('get', (callback) => callback(null, this.api.hap.Characteristic.TemperatureDisplayUnits.CELSIUS));
  }

  async setActive(value, callback) {
    const url = `http://${this.config.ip}/mwrite?{"1130":${value ? '4' : '0'}}`;
    this.log(`SetActive: Sending request to ${url}`);
    try {
      await axios.get(url);
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
      const response = await axios.get(url);
      const isActive = response.data["1130"] === 4;
      this.log(`GetActive: Current state is ${isActive ? 'ON' : 'OFF'}`);
      callback(null, isActive ? 1 : 0);
    } catch (error) {
      this.log(`GetActive: Error - ${error.message}`);
      callback(error);
    }
  }

  async setRotationSpeed(value, callback) {
    let speed;
    if (value >= 1 && value <= 24) {
      speed = 2; // Low
    } else if (value >= 25 && value <= 49) {
      speed = 3; // Normal
    } else if (value >= 50 && value <= 74) {
      speed = 4; // High
    } else if (value >= 75 && value <= 99) {
      speed = 5; // Very High
    } else if (value === 100) {
      speed = 6; // Maximum
    } else {
      speed = 0; // Off
    }

    const url = `http://${this.config.ip}/mwrite?{"1130":${speed}}`;
    this.log(`SetRotationSpeed: Setting speed to ${speed} (value: ${value}%)`);
    try {
      await axios.get(url);
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
      const response = await axios.get(url);
      const speed = response.data["1130"];
      let percentage;

      if (speed === 2) {
        percentage = 12; // Low
      } else if (speed === 3) {
        percentage = 37; // Normal
      } else if (speed === 4) {
        percentage = 62; // High
      } else if (speed === 5) {
        percentage = 87; // Very High
      } else if (speed === 6) {
        percentage = 100; // Maximum
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

  async getCurrentTemperature(callback) {
    const url = `http://${this.config.ip}/mread?{"2000":1}`;
    this.log(`GetCurrentTemperature: Sending request to ${url}`);
    try {
      const response = await axios.get(url);
      const temperature = response.data["2000"] / 10; // Assuming the temperature is returned in tenths
      this.log(`GetCurrentTemperature: Current temperature is ${temperature}°C`);
      callback(null, temperature);
    } catch (error) {
      this.log(`GetCurrentTemperature: Error - ${error.message}`);
      callback(error);
    }
  }

  async setTargetTemperature(value, callback) {
    const targetTemp = Math.round(value * 10); // Convert to tenths
    const url = `http://${this.config.ip}/mwrite?{"2000":${targetTemp}}`;
    this.log(`SetTargetTemperature: Sending request to ${url}`);
    try {
      await axios.get(url);
      this.log(`SetTargetTemperature: Successfully set to ${value}°C`);
      callback(null);
    } catch (error) {
      this.log(`SetTargetTemperature: Error - ${error.message}`);
      callback(error);
    }
  }

  async getTargetTemperature(callback) {
    const url = `http://${this.config.ip}/mread?{"2000":1}`;
    this.log(`GetTargetTemperature: Sending request to ${url}`);
    try {
      const response = await axios.get(url);
      const targetTemperature = response.data["2000"] / 10; // Assuming the temperature is returned in tenths
      this.log(`GetTargetTemperature: Current target temperature is ${targetTemperature}°C`);
      callback(null, targetTemperature);
    } catch (error) {
      this.log(`GetTargetTemperature: Error - ${error.message}`);
      callback(error);
    }
  }

  getServices() {
    return [this.fanService, this.thermostatService];
  }
}