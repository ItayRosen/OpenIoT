/*
	Example: Measure distance with ultrasonic sensor
	Instructions:
		1. Change credentials (Wifi name, Wifi password and Token)
		2. Connect an ultrasonic sensor such as HC-SR04 or some knockoff such as RCW-0001
		a. VCC -> 3V / VCC
		b. GND -> GND (G)
		c. TRING -> GPIO 14 (D5)
		d. ECHO -> GPIO 12 (D6)
		3. Upload sketch to your device (make sure you have both the Openiot library and NewPing library)
		4. Go to the platform and see that the "Distance" component has the value of the distance (in cm) from the sensor!
*/

#include <Openiot.h>
#include <NewPing.h>

//set your wifi credentials and OpenIoT token
const char *ssid = "your_network_name";
const char *password = "your_network_password";
const char *token = "your_token";

//create a client
WiFiClient wifi;
Openiot client(wifi, ssid, password, token);
NewPing sonar(14, 12, 200); //trigger, echo, max distance

//create a distance variable which will store the value from the component
int distance;

void setup() {
	//Open serial port for debugging
	Serial.begin(9600);

	//Set serial port for debugging
	client.setStream(Serial);

	//Start client
	client.begin();

	//Attach the distance variable so we can see it in the platform
	client.attachVariable(distance,"Distance");
}

void loop() {
	//Run client on loop
	client.loop();

	//Read distance
	distance = sonar.ping_cm();
}