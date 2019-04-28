#include "Openiot.h"
#include "Arduino.h"

Openiot::Openiot(Client &client, const char *wifi_ssid, const char *wifi_password, const char *token)
{
    mqtt.setClient(client);
    //set wifi info
    this->ssid = wifi_ssid;
    this->ssid_password = wifi_password;
    //extract mqtt credentials from token
    char *chunk;
    char *_token = strdup(token);
    uint8_t i = 0;
    chunk = strtok(_token,"/");
    while (chunk != NULL) {
        switch (i) {
            case 0:
                user = chunk;
                break;

            case 1:
                password = chunk;
                break;
        }
        i++;
        chunk = strtok(NULL,"/");
    }
}

void Openiot::begin()
{
    //configure wifi
    WiFi.begin(this->ssid, this->ssid_password);
    while (!wifiConnect()) {};
    //configure MQTT
    uint16_t mqttPort = (enableTLS) ? 8883 : 1883;
    mqtt.setServer(mqttServer, mqttPort);
    mqtt.setCallback(std::bind(&Openiot::callback, this, std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));
    while (!MQTTConnect()) {};
    //fire startup function
    this->startup();
}

void Openiot::loop()
{
    //check wifi & mqtt connection
    if (!wifiConnect() || !MQTTConnect()) {
        return;
    }
    //check if ports & variables have changed
    if (runTimer()) {
        portsHandler();
        variablesHandler(false);
    }
    //loop MQTT
    mqtt.loop();
}

bool Openiot::runTimer()
{
    //check with timer if it's time to transmit again
    if (millis() > lastChangeCheck)
    {
        lastChangeCheck = millis() + changeCheckInterval;
        return true;
    }
    return false;
}

/* Communication */

bool Openiot::wifiConnect()
{
    //check if we're connected to WiFi
    if (WiFi.status() != WL_CONNECTED)
    {
        //try to connect wifiTimeout times (x 1s)
        for (uint8_t i = 0; i < wifiTimeout; i++)
        {
            if (serial != NULL) serial->print("."); //debug
            //check if we've connected successfully
            if (WiFi.status() == WL_CONNECTED)
            {
                if (serial != NULL) serial->println("CONNECTED TO WIFI"); //debug
                return true;
            }
            delay(1000);
        }
        //wifi connection failed
        if (serial != NULL) serial->println("Wifi connection failed");
        return false;
    }
    return true;
}

bool Openiot::MQTTConnect()
{
    //check MQTT connection
    if (!mqtt.connected())
    {
        //run mqttTimeout tests (each test is 1 second)
        for (uint8_t i = 0; i < mqttTimeout; i++)
        {
            if (serial != NULL) serial->print("."); //debug
            //create status topic
            char statusTopic[strlen(user) + 12];
            strcpy(statusTopic, user);
            strcat(statusTopic, "/out/status");
            //connect with last will
            if (mqtt.connect(user,user,password,statusTopic,0,false,"disconnected"))
            {
                //build subscription topic
                char subscriptionTopic[strlen(user) + 5];
                strcpy(subscriptionTopic, user);
                strcat(subscriptionTopic, "/in/#");
                //subscribe to topic
                mqtt.subscribe(subscriptionTopic);
                //publish IP
                mqtt.publish(statusTopic, WiFi.localIP().toString().c_str());

                if (serial != NULL) serial->println("connected to MQTT"); //debug
                return true;
            }
        }
        //MQTT failed
        if (serial != NULL) serial->println("MQTT connection failed");
        return false;
    }
    return true;
}

void Openiot::callback(char *topic, byte *payload, uint8_t length)
{
    //byte array to char array
    //char *buffer = (char*)payload;
    char buffer[length + 1];
    for (uint8_t i = 0; i < length; i++) {
        buffer[i] = payload[i];
    }
    buffer[length] = '\0';
    if (serial != NULL) serial->println(buffer);
    //topic to function
    if (strstr(topic, "/in/reboot")) {
        ok();
        delay(1000);
        ESP.restart();
    }
    else if (strstr(topic, "/in/gpio")) {
        updatePort(buffer, length);
    }
    else if (strstr(topic, "/in/variable")) {
        updateVariable(topic, buffer, length);
    }
    else if (strstr(topic, "/in/function")) {
        fireFunction(buffer);
    }
    else if (strstr(topic, "/in/update")) {
        update(buffer, length);
    }
    else {
        if (serial != NULL) serial->println("Unknown operation");
    }
}

void Openiot::ok()
{
    char topic[strlen(user) + 7];
    strcpy(topic, user);
    strcat(topic, "/out/ok");
    mqtt.publish(topic, "ok");
    mqtt.loop();

    if (serial != NULL) serial->println("ok"); //debug
}

/* Debugging */

void Openiot::setStream(Stream &stream)
{
    this->serial = &stream;
}

/* Operations */

void Openiot::setVersion(const char *version)
{
    char topic[strlen(user) + 12];
    strcpy(topic, user);
    strcat(topic, "/out/version");
    mqtt.publish(topic, version);
}

void Openiot::update(char *secret, uint8_t length)
{
    if (!enableOTA) {
        if (serial != NULL) serial->println("OTA is disabled");
        return;
    }
    //send feedback
    ok();
    //create URL
    char url[13 + strlen(mqttServer) + length + strlen(user)];
    strcpy(url, "http://");
    strcat(url, mqttServer);
    strcat(url, "/");
    strcat(url, user);
    strcat(url, "_");
    strcat(url, secret);
    strcat(url, ".bin");

    //update
    t_httpUpdate_return response = ESPhttpUpdate.update(url);

    if (response == HTTP_UPDATE_FAILED)
    {
        char topic[strlen(user) + 12];
        strcpy(topic, user);
        strcat(topic, "/OTA_FAILED");
        mqtt.publish(topic, "1");
        if (serial != NULL) serial->println("OTA Failed");
    }
}

/* Handlers */

uint8_t Openiot::intLength(uint32_t value)
{
    //return char length of integer
    if (value > 9999)
    {
        return 5;
    }
    else if (value > 999)
    {
        return 4;
    }
    else if (value > 99)
    {
        return 3;
    }
    else if (value > 9)
    {
        return 2;
    }
    return 1;
}

void Openiot::startup()
{
    //send startup notification to MQTT broker with sketch size and sketch space
    //create topic
    char topic[strlen(user) + 13];
    strcpy(topic, user);
    strcat(topic, "/out/startup");
    //create sketch size char array
    uint32_t sketchSize = ESP.getSketchSize();
    char _sketchSize[intLength(sketchSize)];
    itoa(sketchSize, _sketchSize, 10);
    //create free sketch space char array
    uint32_t freeSketchSpace = ESP.getFreeSketchSpace();
    char _freeSketchSize[intLength(freeSketchSpace)];
    itoa(freeSketchSpace, _freeSketchSize, 10);
    //create md5 sketch char array
    String sketchHash = ESP.getSketchMD5();
    uint8_t sketchHashSize = sketchHash.length()+1;
    char _sketchHash[sketchHashSize];
    sketchHash.toCharArray(_sketchHash,sketchHashSize);
    //create payload
    char payload[intLength(sketchSize) + 2 + intLength(freeSketchSpace) + sketchHashSize];
    strcpy(payload, _sketchSize);
    strcat(payload, "_");
    strcat(payload, _freeSketchSize);
    strcat(payload, "_");
    strcat(payload, _sketchHash);
    //publish
    mqtt.publish(topic, payload);
    //run mqtt handler
    mqtt.loop();

    if (serial != NULL) serial->println("startup");
}

/* Ports Control */

//attach digital port
void Openiot::attachDigitalPort(uint8_t port, const char *name, uint8_t mode)
{
    attachPort(0, name, port, mode);
}

//attach analog port
void Openiot::attachAnalogPort(uint8_t port, const char *name, uint8_t mode)
{
    attachPort(1, name, port, mode);
}

//attach port
void Openiot::attachPort(uint8_t type, const char *name, uint8_t port, uint8_t mode)
{
    Port *tmp = new Port;
    tmp->number = port;
    tmp->mode = mode;
    tmp->type = type;
    tmp->value = 0;
    tmp->next = NULL;

    if (portHead == NULL)
    {
        portHead = tmp;
        portTail = tmp;
    }
    else
    {
        portTail->next = tmp;
        portTail = portTail->next;
    }

    //change variables to char arrays
    char _mode[1];
    itoa(mode, _mode, 10);
    char _port[intLength(port)];
    itoa(port, _port, 10);
    //create topic
    char topic[strlen(user) + 16 + strlen(_port)];
    strcpy(topic, user);
    if (type == 0)
    {
        strcat(topic, "/out/setDPort/");
    }
    else
    {
        strcat(topic, "/out/setAPort/");
    }
    strcat(topic, _port);
    strcat(topic, "/");
    strcat(topic, _mode);
    //publish
    mqtt.publish(topic, name);
	//set mode
	pinMode(port, mode);
    //debug
    if (serial != NULL) serial->println("attached port");
}

//check ports for changed values
void Openiot::portsHandler()
{
    //create Port object
    Port *tmp = new Port;
    tmp = portHead;
    //loop through ports
    while (tmp != NULL)
    {
        //verify that it's set to INPUT
        if (tmp->mode == INPUT)
        {
            //check if the value has changed
            uint16_t newValue = (tmp->type == 0) ? digitalRead(tmp->number) : analogRead(tmp->number);
            if (newValue != tmp->value)
            {
                //update value
                tmp->value = newValue;
                //transmit new value
                char value[intLength(tmp->value)];
                itoa(tmp->value, value, 10);
                char port[intLength(tmp->number)];
                itoa(tmp->number, port, 10);
                char topic[strlen(user) + 10 + strlen(port)];
                strcpy(topic, user);
                strcat(topic, "/out/port/");
                strcat(topic, port);
                mqtt.publish(topic, value);
                //debug
                if (serial != NULL) serial->println("port value transmitted");
            }
        }
        tmp = tmp->next;
    }
}

//update port value (0 = port number, 1 = value)
void Openiot::updatePort(char *buffer, uint8_t length)
{
    //split buffer to port & value
    char *chunk;
    uint8_t port = 0;
    uint8_t value = 0;
    chunk = strtok(buffer, "/");
    uint8_t i = 0;
    while (chunk != NULL)
    {
        switch (i)
        {
        case 0:
            port = atoi(chunk);
            break;

        case 1:
            value = atoi(chunk);
            break;
        }
        i++;
        chunk = strtok(NULL, "/");
    }
    //create Port object
    Port *tmp = new Port;
    tmp = portHead;
    //loop through ports
    while (tmp != NULL)
    {
        //verify that it's set to OUTPUT & the port matches
        if (tmp->mode == OUTPUT && tmp->number == port)
        {
            ok();
            //update
            tmp->value = value;
            //write
            if (tmp->type == 0)
            {
                digitalWrite(tmp->number, tmp->value);
            }
            else
            {
                analogWrite(tmp->number, tmp->value);
            }
            //transmit new value
            char _value[intLength(tmp->value)];
            itoa(tmp->value, _value, 10);
            char _port[intLength(tmp->number)];
            itoa(tmp->number, _port, 10);
            char topic[strlen(user) + 10 + strlen(_port)];
            strcpy(topic, user);
            strcat(topic, "/out/port/");
            strcat(topic, _port);
            mqtt.publish(topic, _value);
            //debug
            if (serial != NULL) serial->println("port changed");
            return;
        }
        tmp = tmp->next;
    }
    if (serial != NULL) serial->println("Unknown port update");
}

/* Variable Control */

void Openiot::attachVariable(String &variable, const char *name)
{
    _attachVariable(&variable, name, 0);
}

void Openiot::attachVariable(char *variable, const char *name) {
    _attachVariable(variable, name, 1);
}

void Openiot::attachVariable(int &variable, const char *name) {
    _attachVariable(&variable, name, 2);
}

void Openiot::attachVariable(float &variable, const char *name) {
    _attachVariable(&variable, name, 3);
}

void Openiot::_attachVariable(void *variable, const char *name, uint8_t type)
{
    //create instance
    Variable *tmp = new Variable;
    tmp->name = name;
    tmp->variable = variable;
    tmp->type = type;
    tmp->value = 0;
    tmp->next = NULL;
    //assign location
    if (variableHead == NULL)
    {
        variableHead = tmp;
        variableTail = tmp;
    }
    else
    {
        variableTail->next = tmp;
        variableTail = variableTail->next;
    }
    //attach to platform
    variablesHandler(true);
}

void Openiot::variablesHandler(bool attach)
{
    //create variable object
    Variable *tmp = new Variable;
    tmp = variableHead;
    //loop through variables
    while (tmp != NULL)
    {
        //check if value has changed
        uint32_t newVal = 0;

        if (tmp->type == 0)
        {
            //string
            String variable = *(String *)tmp->variable;
            newVal = stringToInt(variable);
            if (newVal != tmp->value || attach) {
                tmp->value = newVal;
                char buf[variable.length()+1];
                variable.toCharArray(buf, variable.length() + 1);
                variableTransmit(tmp->type, tmp->name, buf);
            }
        }
        else if (tmp->type == 1)
        {
            //char
            newVal = stringToInt((char*)tmp->variable);
            if (newVal != tmp->value || attach) {
                tmp->value = newVal;
                variableTransmit(tmp->type, tmp->name, (char*)tmp->variable);
            }
        }
        else if (tmp->type == 2)
        {
            //int
            newVal = *(int*)tmp->variable;
            if (newVal != tmp->value || attach) {
                tmp->value = newVal;
                char buf[intLength(newVal)+1];
                itoa(newVal, buf, 10);
                buf[intLength(newVal)] = '\0';
                variableTransmit(tmp->type, tmp->name, buf);
            }
        }
        else if (tmp->type == 3)
        {
            //float
            newVal = (*(float*)tmp->variable) * 100;
            if (newVal != tmp->value || attach){ 
                tmp->value = newVal;
                uint8_t length = intLength((int)*(float*)tmp->variable);
                char buf[length+4];
                dtostrf(*(float*)tmp->variable, length, 2, buf);
                variableTransmit(tmp->type, tmp->name, buf);
            }
        }
        else {
            if (serial != NULL) serial->println("Unknown variable type");
        }
        tmp = tmp->next;
    }
}

void Openiot::variableTransmit(uint8_t _type, const char *name, char *value) {
    char type[1];
    itoa(_type, type, 10);
    char topic[strlen(user) + 11 + strlen(name)];
    strcpy(topic, user);
    strcat(topic, "/out/var/");
    strcat(topic, type);
    strcat(topic, "/");
    strcat(topic, name);
    mqtt.publish(topic, value);

    if (serial != NULL) serial->println("attached variable");
}

void Openiot::updateVariable(char *topic, char *buffer, uint8_t length) {
    //extract name
    uint8_t index = 0;
    char * name;
    name = strtok(topic,"/");
    while (name != NULL) {
        if (index == 3) break;
        name = strtok(NULL,"/");
        index++;
    }
    //loop through variables
    Variable *tmp = new Variable;
    tmp = variableHead;
    while (tmp != NULL) {
        //check if name matches
        if (strcmp(tmp->name,name) == 0) {
            //check type
            switch (tmp->type) {
                case 0:
                    //string
                    *(String *)tmp->variable = String(buffer);
                    break;
                
                case 1:
                    //char array
                    strcpy((char*)tmp->variable,buffer);
                    break;

                case 2:
                    //int 
                    *(int*)tmp->variable = atoi(buffer);
                    break;

                case 3:
                    //float
                    *(float*)tmp->variable = atof(buffer);
                    break;
            }
            ok();
            return;
        }
        tmp = tmp->next;
    }
    if (serial != NULL) serial->println("Unknown variable update");
}

uint16_t Openiot::stringToInt(String str) {
    uint16_t val = 0;
    for (uint8_t i = 0; i < str.length(); i++) {
        val += (int)str[i];
    }
    return val;
}

uint16_t Openiot::stringToInt(char *str) {
    uint16_t val = 0;
    for (uint8_t i = 0; i < strlen(str); i++) {
        val += (int)str[i];
    }
    return val;
}

/* Functions Control */ 

void Openiot::attachFunction(void(*function)(), const char *name) {
    Function *tmp = new Function;
    tmp->name = name;
    tmp->f = function;
    tmp->next = NULL;

    if (functionHead == NULL)
    {
        functionHead = tmp;
        functionTail = tmp;
    }
    else
    {
        functionTail->next = tmp;
        functionTail = functionTail->next;
    }

    //transmit function name
    char topic[strlen(user) + 14 + strlen(name)];
    strcpy(topic, user);
    strcat(topic, "/out/function");
    mqtt.publish(topic, name);

    if (serial != NULL) serial->println("attached function");
}

void Openiot::fireFunction(char *name) {
    //loop through attached functions
    Function *tmp = new Function;
    tmp = functionHead;
    while (tmp != NULL) {
        //check if the function matches
        if (strcmp(tmp->name,name) == 0) {
            //send feedback & fire function
            ok();
            tmp->f();
            return;
        }
        tmp = tmp->next;
    }
    if (serial != NULL) serial->println("Unknown function");
}