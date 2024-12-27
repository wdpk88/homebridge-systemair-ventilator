# Homebridge Systemair Ventilator Plugin

This Homebridge plugin allows you to control your Systemair Ventilator using discrete speed levels (Low, Normal, High, Very High, and Maximum) and adjust the temperature settings via HomeKit. The plugin communicates with your Systemair device over HTTP and integrates seamlessly into your Homebridge setup.

## Features

- **Fan Control**: Control the fan with five discrete speed levels:
  - Low: 1-24%
  - Normal: 25-49%
  - High: 50-74%
  - Very High: 75-99%
  - Maximum: 100%
- **Temperature Control**:
  - Read the current temperature from the ventilator.
  - Adjust the target temperature (12-30°C).
- **HomeKit Integration**: The ventilator is represented as a single device in HomeKit with a **Fan** and **Thermostat** interface.

## How It Works

The plugin communicates with your Systemair Ventilator via HTTP API calls. Based on the fan speed percentage set in HomeKit, it determines the corresponding step and sends the appropriate command to the ventilator. Similarly, it fetches and updates the temperature settings through the ventilator's HTTP API.

### Fan Speed Mapping
| Percentage Range | Step | Description   |
|------------------|------|---------------|
| 1-24%           | 2    | Low           |
| 25-49%          | 3    | Normal        |
| 50-74%          | 4    | High          |
| 75-99%          | 5    | Very High     |
| 100%            | 6    | Maximum       |

### Temperature Adjustment
- The thermostat interface allows you to set a target temperature in the range of 12-30°C.
- The current temperature is fetched and displayed in HomeKit.

## Installation

1. Clone the repository to your Homebridge setup:
   ```bash
   git clone https://github.com/yourusername/homebridge-systemair-ventilator.git
