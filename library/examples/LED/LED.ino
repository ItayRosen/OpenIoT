/*
	Example: Dim LED
	Instructions:
		1. Change credentials (Wifi name, Wifi password and Token)
		2. Connect an LED
		a. Shorted leg -> GND
		b. Longer leg -> 1k Ohm resistor -> GPIO 14 (D5)
		3. Upload sketch to your device
		4. Go to the platform and update the value (with the slider) of the LED component
		4. Look at the LED and see its brightness change
*/

#include <Openiot.h>

//set your wifi credentials and OpenIoT token
const char *ssid = "your_network_name";
const char *password = "your_network_password";
const char *token = "your_token";

//create a client
WiFiClient wifi;
Openiot client(wifi, ssid, password, token);

void setup() {
	//Open serial port for debugging
	Serial.begin(9600);

	//Set serial port for debugging
	client.setStream(Serial);

	//Start client
	client.begin();

	//Attach an analog port (not really analog, it will use PWM instead)
	client.attachAnalogPort(14,"LED",OUTPUT);
}

void loop() {
	//Run client on loop
	client.loop();
}