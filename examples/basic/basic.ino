/*
	Example: Attach components
	Instructions:
		1. Change credentials (Wifi name, Wifi password and Token)
		2. Upload sketch to your device (make sure you added the library to your IDE!)
		3. Go to the platform see your newly created components
		4. Try firing the function and see how your serial monitor prints "Success!"
*/

#include <Openiot.h>

//set your wifi credentials and OpenIoT token
const char *ssid = "wifi_network_name";
const char *password = "wifi_password";
const char *token = "your_openiot_token";

//create a client
WiFiClient wifi;
Openiot client(wifi, ssid, password, token);

//create test variable that we can attach later
int testVariable = 10;

//pre-declare function for attachment
void testFunction();

void setup() {
	//Open serial port for debugging
	Serial.begin(9600);
	Serial.println("Starting..");
	//Set serial port for debugging
	client.setStream(Serial);
	
	//Start client
	client.begin();
	
	//Set firmware version (optional)
	client.setVersion("1.0.1");
	  
	//Attach output digital port 5
	client.attachDigitalPort(5,"My Digital Port",OUTPUT);
	//Attach input analog port A0
	client.attachAnalogPort(A0,"My Analog Port",INPUT);
	//Attach variable. Allowed types: String, char array, int and float.
	client.attachVariable(testVariable,"Test Variable");
	//Attach function. You can only attach void functions that do not take any parameters.
	client.attachFunction(testFunction,"Test Function");
}

void loop() {
	//Run client on loop
	client.loop();
}

//function we attach to the platform
void testFunction() {
   Serial.println("Success!");
}
