/*
	Example: 4 Sigment Display
	Instructions:
		1. Change credentials (Wifi name, Wifi password and Token)
		2. Connect a TM1637 (or a similar knockoff such as HW-069)
		a. VIN -> 3V / VCC
		b. GND -> GND (G)
		c. CLK -> GPIO 14 (D5)
		d. DIO -> GPIO 12 (D6)
		3. Upload sketch to your device (make sure you have both the Openiot library and TM1637Display library)
		4. Go to the platform and update the component "Display" with a 4 digit value
		5. Look at the display module, it has changed its state! (or at least should have)
*/

#include <Openiot.h>
#include <TM1637Display.h>

//set your wifi credentials and OpenIoT token
const char *ssid = "your_network_name";
const char *password = "your_network_password";
const char *token = "your_token";

//create a client
WiFiClient wifi;
Openiot client(wifi, ssid, password, token);
TM1637Display display(14, 12); //CLK, DIO

//create a variable for the display to attach to the platform
int displayVar = 0;

void setup() {
	//Open serial port for debugging
	Serial.begin(9600);

	//Set serial port for debugging
	client.setStream(Serial);

	//Start client
	client.begin();

	//Attach int variable
	client.attachVariable(displayVar,"Display");

	//Set display brightness to maximum
	display.setBrightness(0x0a);
}

void loop() {
	//Run client on loop
	client.loop();

	//Update display
	display.showNumberDec(displayVar);
}