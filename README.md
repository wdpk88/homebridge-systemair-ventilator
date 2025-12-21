# Homebridge Systemair Ventilator Plugin
This is a Homebridge plugin for controlling a Systemair Ventilator through its web interface then into HomeKit. You must have a SAVEConnect WIFI module connected for this to work. You will need the IP address of the SAVEConnect device and include it in the plugin settings.

# Installation:
If Homebridge is not already installed, use the following command to install it globally:

1. Install Homebridge:
   ```bash
   npm install -g homebridge
   
2. Install the Plugin
   ```bash
   npm install -g homebridge-systemair-ventilator
Run the following command to install the Homebridge Systemair Ventilator plugin:

3. Configure the Plugin
Edit the Homebridge config.json file to include the plugin. Add the following under "accessories":
   ```yaml
   {
     "accessories": [
       {
         "accessory": "SystemairVentilator",
         "name": "Living Room Ventilator",
         "ip": "x.x.x.x"
       }
     ]
   }
Replace add your Systemair IP with the actual IP address of your Systemair SAVEConnect device.

4. Restart Homebridge
Restart Homebridge for the changes to take effect:
   ```bash
   sudo systemctl restart homebridge 

✨ What’s New / Recently Updated

🔥 Temperature control via HomeKit (NEW)
A Thermostat service is now exposed in HomeKit

View and change the target temperature directly from the Apple Home app

A temperature dial is shown in HomeKit

Temperature range: 10°C – 30°C (0.5°C steps)

❌ Fixed: Temperature resetting to 18°C
Previously, using the Refresh function forced the temperature back to 18°C

This behavior has been fixed

Refresh now preserves the user-selected temperature

🧠 Improved HomeKit stability
Safe fallbacks ensure HomeKit always receives valid temperature values

Prevents HomeKit from hiding the thermostat UI due to missing or invalid data

🔄 Improved Refresh behavior
Refresh mode no longer overrides temperature settings

Fan speed and temperature are automatically restored after refresh completes


# Features:
Control fan speeds with three settings: Low, Medium, and High.
Adjust the target temperature directly from HomeKit.
Automatically handles fan activation and speed synchronization.
Create scenes for Low, Normal, and High with the following mappings:

speed === 1 maps to 0% (Off)
speed === 2 maps to 16% (Low)
speed === 3 maps to 50% (Normal)
speed === 4 maps to 83% (High)

# Troubleshooting:
If the ventilator doesn't respond, check the following:

Ensure the IP address in the configuration is correct.
Verify that the SAVEConnect WIFI module is online.
Check Homebridge logs for error messages.

