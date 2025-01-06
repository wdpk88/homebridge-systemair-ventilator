# Homebridge Systemair Ventilator Plugin
This is a Homebridge plugin for controlling a Systemair Ventilator through its web interface. You must have a SAVEConnect WIFI module connected for this to work. You will need the IP address of the SAVEConnect device and include it in the plugin settings.

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
         "ip": "192.168.x.x"
       }
     ]
   }
Replace add your Systemair IP with the actual IP address of your Systemair SAVEConnect device.

4. Restart Homebridge
Restart Homebridge for the changes to take effect:

´´bash
sudo systemctl restart homebridge

# Features:
Control fan speeds with three settings: Low, Medium, and High.
Adjust target temperature directly from HomeKit.
Automatically handles fan activation and speed synchronization.

# Troubleshooting:
If the ventilator doesn't respond, check the following:

Ensure the IP address in the configuration is correct.
Verify that the SAVEConnect WIFI module is online.
Check Homebridge logs for error messages.
