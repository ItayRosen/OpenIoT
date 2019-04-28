#ifndef Openiot_h
#define Openiot_h

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include "PubSubClient.h"
#include <ESP8266httpUpdate.h>
#include <Stream.h>

//Configuration - You can edit the values to optimize performance
#define wifiTimeout 10 //wifi timeout in seconds
#define mqttTimeout 10 //mqtt timeout in seconds
#define changeCheckInterval 5000 //delay between gpio & variable change check (in ms)

//Not configurable - Do not edit
#define mqttServer "mqtt.openiot.xyz" //MQTT server

class Openiot {
  private:
  const char* ssid; //wifi name
  const char* ssid_password; //wifi pass
  const char* server; //mqtt server
  const char* user; //mqtt user
  const char* password; //mqtt pass
  bool wifiConnect(); //WiFi connection
  bool MQTTConnect(); //MQTT connection
  PubSubClient mqtt; //MQTT client
  void update(char *secret, uint8_t length); //update ota
  uint32_t lastChangeCheck; //timing for transmitting
  bool runTimer(); //checks if it's time to transmit
  uint8_t intLength(uint32_t value); //return the length of integer
  void startup(); //send indication to MQTT broker that the device has just restarted
  void ok(); //send feedback after transmission
  Stream* serial = NULL;; //serial output for debugging

  //Functions Control
  struct Function {
    const char *name;
    void (*f)();
    Function *next;
  };
  Function* functionHead = NULL;
  Function* functionTail = NULL;
  void fireFunction(char *name);

  //GPIO Control
  struct Port {
      uint8_t number;
      uint8_t mode;
      uint16_t value;
      uint8_t type;
      Port *next;
  };
  Port* portHead = NULL;
  Port* portTail = NULL;
  void attachPort(uint8_t type, const char *name, uint8_t port, uint8_t mode);
  void portsHandler(void);
  void updatePort(char *buffer, uint8_t length);

  //Variable Control
  struct Variable {
      const char *name;
      uint8_t type; //0 = string, 1 = char array, 2 = int, 3 = float
      void *variable;
      uint32_t value; //int value of variable
      Variable *next;
  };
  Variable* variableHead = NULL;
  Variable* variableTail = NULL;
  void _attachVariable(void *variable, const char *name, uint8_t type);
  void variablesHandler(bool attach);
  void variableTransmit(uint8_t _type, const char *name, char *value);
  uint16_t stringToInt(String str);
  uint16_t stringToInt(char *str);
  void updateVariable(char *topic, char *buffer, uint8_t length); //update variable value from platform
    
  public:
  Openiot(Client &client, const char *wifi_ssid, const char *wifi_password, const char *token); //constructor
  void callback(char* topic, byte* payload, uint8_t length); //mqtt callback
  void begin(); //create wifi & mqtt connection
  void loop(); //handler
  void setStream(Stream &stream); //set output for Serial debugging
  bool enableTLS = false; //enable communication over TLS (port 8883)
  bool enableOTA = true; //enable or disable OTA updates
  void setVersion(const char *version); //attach firmware version to Platform
  //attach ports, variables and functions to Platform Control
  void attachVariable(int& variable, const char *name);
  void attachVariable(String& variable, const char *name);
  void attachVariable(float& variable, const char *name);
  void attachVariable(char *variable, const char *name);
  void attachDigitalPort(uint8_t _port, const char *name, uint8_t _mode);
  void attachAnalogPort(uint8_t _port, const char *name, uint8_t _mode);
  void attachFunction(void(*function)(), const char *name);
};

#endif
