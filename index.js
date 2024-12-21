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

    this.service = new this.api.hap.Service.Fanv2(this.config.name);
    this.setupCharacteristics();
  }

  setupCharacteristics() {
    this.service
      .getCharacteristic(this.api.hap.Characteristic.Active)
      .on('set', this.setActive.bind(this))
      .on('get', this.getActive.bind(this));

    this.service
      .getCharacteristic(this.api.hap.Characteristic.RotationSpeed)
      .on('set', this.setRotationSpeed.bind(this))
      .on('get', this.getRotationSpeed.bind(this));
  }

  setActive(value, callback) {
    const url = `http://${this.config.ip}/mwrite?{"1130":${value ? '4' : '0'}}`;
    axios.get(url)
      .then(() => {
        callback(null);
      })
      .catch(error => {
        callback(error);
      });
  }

  getActive(callback) {
    const url = `http://${this.config.ip}/mread?{"1130":1}`;
    axios.get(url)
      .then(response => {
        const isActive = response.data["1130"] === 4;
        callback(null, isActive);
      })
      .catch(error => {
        callback(error);
      });
  }

  setRotationSpeed(value, callback) {
    const speed = Math.floor(value / 25) + 2; // Convert 0-100 scale to 2-6
    const url = `http://${this.config.ip}/mwrite?{"1130":${speed}}`;
    axios.get(url)
      .then(() => {
        callback(null);
      })
      .catch(error => {
        callback(error);
      });
  }

  getRotationSpeed(callback) {
    const url = `http://${this.config.ip}/mread?{"1130":1}`;
    axios.get(url)
      .then(response => {
        const speed = (response.data["1130"] - 2) * 25; // Convert 2-6 scale to 0-100
        callback(null, speed);
      })
      .catch(error => {
        callback(error);
      });
  }

  getServices() {
    return [this.service];
  }
}
