/*
	Example: Print variable
	Instructions:
		1. Change credentials (Wifi name, Wifi password and Token)
		2. Upload sketch to your device (make sure you added the library to your IDE!)
		3. Go to the platform and update your newly create variable to something else
		4. Watch how your serial monitor prints that value
*/

#include <Openiot.h>

//set your wifi credentials and OpenIoT token
const char *ssid = "wifi_network_name";
const char *password = "wifi_password";
const char *token = "your_openiot_token";

//create a client
WiFiClient wifi;
Openiot client(wifi, ssid, password, token);

//create a variable that we can attach later
String myVariable = "Hello";

void setup() {
	//Set serial port for debugging
	Serial.begin(9600);
	client.setStream(Serial);
	
	//Start client
	client.begin();
	  
	//Attach variable
	client.attachVariable(myVariable,"My Variable");
}

void loop() {
	//Run client on loop
	client.loop();
	
	//Print the variable every 5 seconds
	Serial.println(myVariable);
	delay(5000);
}