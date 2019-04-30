# Library Documentation
> Methods and general information for the board's library

## Quick Start
> Connect a device to the platform

````
#include <Openiot.h>

//set your wifi credentials and OpenIoT token
const char *ssid = "wifi_network_name";
const char *password = "wifi_password";
const char *token = "your_openiot_token";

//create a client
WiFiClient wifi;
Openiot client(wifi, ssid, password, token);

void setup() {
	//Start client
	client.begin();
}

void loop() {
	//Run client on loop
	client.loop();
}
````

## Credentials
You need to pass 4 parameters to the constructor:

* Wifi client (needs to be initiated beforehand of course)
* Wifi network name
* Wifi network password
* OpenIoT Token (get it by going to the platform Dashboard, choosing [or creating] your thing, clicking on the Thing's name and choosing "Get Token").

## Calls
The client needs to be called at least two times:

* Once on the setup function - `client.begin()`
* On every system loop (on the loop function) - `client.loop()`.

## Attach Components
> You can attach functions, variables and ports to the platform. Attaching is done once on the setup function.

### Analog Port
* Usecases: Dim LED , control servo motor, read a temperature sensor's value
* Usage: `client.attachDigitalPort(number, name, mode)`

### Digital Port
* Usecases: LED switch, turn relay on / off, read binary sensors (1 / 0)
* Usage: `client.attachAnalogPort(number, name, mode)`

    * number - The port's number. Example: 1, 9, A0
    * name - How you'd like to name this component. Will be used to identify this port on the platform. Example: "My LED"
    * mode - Whether you'd like to read the port's value on the platform or set it from the platform. Values can be "INPUT" or "OUTPUT". It's much like how you'd use pinMode on Arduino environment.
    
````
#include <Openiot.h>

WifiClient wifi;
Openiot client(wifi, ssid, password, token);

void setup() {
	Serial.begin(9600);
	client.begin();
	client.setStream(Serial);
	client.attachDigitalPort(5, "Temperature", INPUT);
	client.attachAnalogPort(A0, "Dim LED", OUTPUT);
}

void loop() {
	client.loop();
}
````
### Variable

* Usecases : Display control, serial communication, read calculated variables (such as data from IMU)
* Usage: `client.attachVariable(variable, name)`
	* variable - A variable that has already been declared in the sketch. Supported types: string, char array, int, float. Important: If the variable type is char array, make sure you allocate enough size so you can update its value from the platform.
	* name - How you'd like to name this component. Will be used to identify this variable on the platform

````
#include <Openiot.h>

WifiClient wifi;
Openiot client(wifi, ssid, password, token);
String someText = "";

void setup() {
	Serial.begin(9600);
	client.begin();
	client.setStream(Serial);
	client.attachVariable(someText, "Printable text");
}

void loop() {
	client.loop();
	Serial.println(someText);
	delay(1000);
}
````

### Function
* Usecases: Perform any operation. Can be used alongside other components (e.g. variable component to store a string and a function component to update an LCD with said variable)
* Usage:  `client.attachFunction(function, name)`
	* function - A void function that takes no parameters. Important: If the function is declared after its attachement to the platform, then it has to be declared beforehand as such: `void functionName();`
	* name - How you'd like to name this component. Will be used to identify this function on the platform
````
#include <Openiot.h>

WifiClient wifi;
Openiot client(wifi, ssid, password, token);
void myFunction();

void setup() {
	Serial.begin(9600);
	client.begin();
	client.setStream(Serial);
	client.attachFunction(myFunction, "My Function");
}

void loop() {
	client.loop();
}

void myFunction() {
	Serial.println("Function executed successfully!");
}
````
	
## TLS
You can configure OpenIoT to communicate securely over TLS. It's not activated by default because it requires quite a bit of flash size (for WiFiClientSecure) and memory (for the certificate). Communication is operated over port 1883 by default, when TLS is enabled, it's operated over port 8883. Using TLS is recommended in order to prevent Man in the Middle attacks.
Enable TLS by calling `client.enableTLS = true;`. For TLS to work you also need to pass WiFiClientSecure instead of WiFiClient as well as set up SSL certifications. Example code:
````
WiFiClientSecure wifi;
Openiot client(wifi, ssid, password, token);
````

## Additional Methods
* setVersion - Indetify the device's firmware version. Can be called like this: `client.setVersion("1.0.0");`
* enableOTA - OTA is enabled by default. You can disable it by calling `client.enableOTA = false;`

## Debugging
You can debug using a preferred serial interface. I suggest using this feature for any development phase.
````
void setup() {
	Serial.begin(9600);
	client.begin();
	client.setStream(Serial);
}
````
You can also use software serial:
````
#include <SoftwareSerial.h>
#include <Openiot.h>

SoftwareSerial mySerial(rxPin, txPin);
WifiClient wifi;
Openiot client(wifi, ssid, password, token);

void setup() {
	mySerial.begin(9600);
	client.begin();
	client.setStream(mySerial);
}
````
