const axios = require('axios');

let Service, Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
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
    this.timerDuration = 20; // Default timer duration (minutes)

    this.axiosInstance = axios.create({
      timeout: 20000, // 20 seconds timeout
    });

    // Fan service
    this.fanService = new Service.Fanv2(this.config.name + " Fan");

    // Refresh service (to start the timer)
    this.refreshService = new Service.Switch(this.config.name + " Refresh");

    // Timer duration input (allows users to set how many minutes)
    this.timerInputService = new Service.Lightbulb(this.config.name + " Timer Input");

    // Timer display (shows remaining time as a HumiditySensor)
    this.timerService = new Service.HumiditySensor(this.config.name + " Timer");

    this.setupCharacteristics();
  }

  setupCharacteristics() {
    // Fan characteristics
    this.fanService
      .getCharacteristic(Characteristic.Active)
      .onSet(this.setActive.bind(this))
      .onGet(this.getActive.bind(this));

    this.fanService
      .getCharacteristic(Characteristic.RotationSpeed)
      .onSet(this.setRotationSpeed.bind(this))
      .onGet(this.getRotationSpeed.bind(this));

    // Refresh characteristic (activates the timer)
    this.refreshService
      .getCharacteristic(Characteristic.On)
      .onSet(this.setRefresh.bind(this));

    // Timer input characteristic (to allow user to set duration)
    this.timerInputService
      .getCharacteristic(Characteristic.Brightness) // Use Brightness to allow a value input in HomeKit
      .onSet(this.setTimerDuration.bind(this))
      .onGet(this.getTimerDuration.bind(this));

    // Timer characteristic (reads the remaining time)
    this.timerService
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .onGet(this.getTimer.bind(this));
  }

  async retryRequest(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await this.axiosInstance.get(url);
      } catch (error) {
        if (i === retries - 1) {
          this.log(`Retry failed: ${error.message}`);
          throw error;
        }
        this.log(`Retrying request (${i + 1}/${retries}) due to: ${error.message}`);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1s delay before retry
      }
    }
  }

  async setActive(value) {
    const url = `http://${this.config.ip}/mwrite?{"1130":${value ? '1' : '0'}}`;
    this.log(`SetActive: Sending request to ${url}`);
    await this.retryRequest(url);
    this.log(`SetActive: Successfully set to ${value ? 'ON' : 'OFF'}`);
  }

  async getActive() {
    const url = `http://${this.config.ip}/mread?{"1130":1}`;
    this.log(`GetActive: Sending request to ${url}`);
    const response = await this.retryRequest(url);
    const isActive = response.data["1130"] > 0;
    this.log(`GetActive: Current state is ${isActive ? 'ON' : 'OFF'}`);
    return isActive ? 1 : 0;
  }

  async setRotationSpeed(value) {
    let speed;
    if (value === 0) {
      speed = 0;
    } else if (value <= 16) {
      speed = 2;
    } else if (value <= 50) {
      speed = 3;
    } else {
      speed = 4;
    }

    const url = `http://${this.config.ip}/mwrite?{"1130":${speed}}`;
    this.log(`SetRotationSpeed: Setting speed to ${speed} (value: ${value}%)`);
    await this.retryRequest(url);
    this.log(`SetRotationSpeed: Successfully set to speed ${speed}`);
  }

  async getRotationSpeed() {
    const url = `http://${this.config.ip}/mread?{"1130":1}`;
    this.log(`GetRotationSpeed: Sending request to ${url}`);
    const response = await this.retryRequest(url);
    const speed = response.data["1130"];
    let percentage = speed === 2 ? 16 : speed === 3 ? 50 : speed === 4 ? 83 : 0;
    this.log(`GetRotationSpeed: Current speed is ${speed} (value: ${percentage}%)`);
    return percentage;
  }

  async setRefresh(value) {
    if (value) {
      const writeUrl = `http://${this.config.ip}/mwrite?{"1103":${this.timerDuration}}`;
      this.log(`Refresh: Sending request to ${writeUrl} for ${this.timerDuration} minutes`);
      await this.retryRequest(writeUrl);
      this.log(`Refresh: Successfully started refresh mode for ${this.timerDuration} minutes.`);
      setTimeout(() => {
        this.refreshService
          .getCharacteristic(Characteristic.On)
          .updateValue(false);
      }, 1000);
    }
  }

  async getTimer() {
    const url = `http://${this.config.ip}/mread?{"1103":1}`;
    this.log(`Timer: Fetching remaining time from ${url}`);
    try {
      const response = await this.retryRequest(url);
      let timerValue = response.data["1103"]; // Extract timer value

      if (timerValue < 0) timerValue = 0;
      if (timerValue > 100) timerValue = 100;

      this.log(`Timer: Remaining time is ${timerValue} minutes.`);
      return timerValue;
    } catch (error) {
      this.log(`Timer: Error - ${error.message}`);
      return 0;
    }
  }

  async setTimerDuration(value) {
    this.timerDuration = Math.max(1, Math.min(value, 100)); // Ensure 1-100 min range
    this.log(`Timer Duration Set: ${this.timerDuration} minutes`);
  }

  async getTimerDuration() {
    this.log(`Timer Duration Read: ${this.timerDuration} minutes`);
    return this.timerDuration;
  }

  getServices() {
    return [this.fanService, this.refreshService, this.timerService, this.timerInputService];
  }
}
