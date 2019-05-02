# Self Host
> Run OpenIoT on your own server

The platform is split into 4 main components:
* Front end - the "face" of the platform. It's developed with ReactJS. You can run it on your local machine or on a web server.
* Back end - the "logic" of the platform. It has to run on a linux machine.
* Communication - between the platform and your device(s). The communication protocol is MQTT. It has to run on the same machine as the back end.
* Memory - i.e. the database. Here we're using Firebase's realtime database (NoSQL).

What you are going to need:
* A linux machine (in the docs we are going to use a $5 DigitalOcean VPS running Ubuntu 18.04.2 with Apache as the webserver)
* A firebase account (the free version is enough for most usecases)

## 1. Setting up a webserver
> We'll use Apache as our webserver. It will run the back end files as a form of an API.
* Start off by updating the local package index by running `sudo apt update`
* Now, let's install apache and php `sudo apt install apache2 php7.0 libapache2-mod-php7.0 php-mbstring`
* To eliminate firewall issues, we'll whitelist apache by running `sudo ufw allow 'Apache'`
* Let's autostart apache in case the machine reboots: `sudo systemctl enable apache2`
* To make sure the webserver is set up successfully, navigate to the IP address of your machine on your browser and make sure the default page for Apache comes up.

## 2. Setting up MQTT
> MQTT will handle the communication between our devices and the platform
* Let's start by installing mosquitto by running `sudo apt-get install mosquitto mosquitto-clients`
* To configure MQTT to use specific user credentials, let's edit the configuration file: `sudo nano /etc/mosquitto/conf.d/default.conf`
* Populate the file with:
````
allow_anonymous false
password_file /etc/mosquitto/passwd
acl_file /etc/mosquitto/conf.d/access_control
````
* Save the file by pressing CTRL + X, Y, Enter. Now let's restart the service by running `sudo systemctl restart mosquitto`.
* Now we'll create a file for easy user access control management. Run `sudo nano /home/addUser.sh` and populate it with:
````
#!/bin/bash
mosquitto_passwd -b /etc/mosquitto/passwd $1 $2
echo -e "user $1\ntopic read $1/in/#\ntopic write $1/out/#\n" >> /etc/mosquitto/conf.d/access_control
kill -SIGHUP $(cat /var/run/mosquitto.pid)
echo "1";
````
* To make the script executable and give apache permission to run it with sudo, run `sudo chmod +x /home/addUser.sh` and then `sudo echo -e "www-data ALL=NOPASSWD: /home/addUser.sh" >> /etc/sudoers`
* We need to create a user that will handle all incoming data. We'll call it `worker`. Run `sudo mosquitto_passwd -c /etc/mosquitto/passwd worker` and enter a password, then run `sudo echo -e "user worker\ntopic #\n" >> /etc/mosquitto/conf.d/access_control`
* We also need a user to transmit data. We'll call it `admin`. Run `sudo mosquitto_passwd -b /etc/mosquitto/passwd admin PASSWORD` (replace PASSWORD with the password you've previously set), then run `sudo echo -e "user admin\ntopic #\n" >> /etc/mosquitto/conf.d/access_control`
* Let's reload the configuration file: `sudo service mosquitto restart`
* Now we need to add the mqtt worker. It's a script that handles all incoming mqtt data and updates the database accordingly. To run it on the background, execute: `screen -d -m php /var/www/html/API/config/worker.php`

## 3. Setting up a Firebase realtime database
> The realtime database will store all the data. A free user is sufficient for our needs.
* Go to the [console](https://console.firebase.google.com) and create a new project.
* Enter the project's dashboard, go to Database on the left menu and create a new database (start in locked mode).
* Select Realtime Database (by clicking on Cloud Firestore at the top) and click on Rules. Populate it with the following:
````
{
  "rules": {
    ".read": false,
    ".write": false,
    "users": {
      ".indexOn": "email"
    },
    "things": {
      "$thingID": {
        "logs": {
          ".indexOn": "time"
        },
        "notifications": {
        	".indexOn": ["name","triggerValue","trigger"]
        }
      }
    },
    "loginLogs": {
      ".indexOn": "ip"
    },
    "banIP": {
      ".indexOn": "ip"
    }
  }
}
````

## 4. Uploading the back end files
* Create a new directory for the back end files. I suggest naming it "API". Go ahead and run: `sudo mkdir /var/www/html/API`
* Download the [api folder](../../api) and upload its contents to the target folder we've created earlier (`/var/www/html/API`).
* Edit the `constants` file (`config/constants.php`) and change the base locations. In our example, we will make the following changes:
````
<?php
define('debug_location','/var/www/html/API/config/error.log');
define('firebase_secret','/var/www/html/API/config/secrets/firebase.json');
define('mqtt_secret','/var/www/html/API/config/secrets/mqtt.json');
define('uploads_location','/var/www/html/uploads/');
define('client_ip',$_SERVER["REMOTE_ADDR"] ?? '127.0.0.1');
````
* Create an MQTT credentials file at the location we previously specified: `sudo nano /var/www/html/API/config/secrets/mqtt.json` and populate it with the following (after changing the data to match your own):
````
{
	"ip": "SERVER_IP_ADDRESS",
	"password": "MQTT_WORKER_PASSWORD",
	"port": 1883,
	"username": "worker"
}
````
* Now we need to grant the platform access to the database. Go back to your firebase project and to service accounts (settings icon on the left -> Project settings -> Service accounts), generate a new private key and save it under `/var/www/html/API/config/secrets`. Rename the file to `firebase.json`.

## 5. Running the front end interface
* Download the [platform folder](../../platform) to your PC.
* Edit the constants file (`src/constants/constants.js`) and change `API_URL` to the API location we've set up earlier. Most likely http://SERVER_IP_ADDRESS/API/ . Save the file.
* Next, in order to run the front end interface, you'll need to install [npm](https://www.npmjs.com/get-npm) (via [nodeJS](https://nodejs.org/en/)). 
* Naviagte to the platform folder you've downloaded with your CLI of choice and run `npm install`. 
* To run it locally, run `npm start`. To run the platform on the webserver, run `yarn build` and upload the contents of the newly created `build` folder to your webserver.

## 6. Update your device's code
The only change inside the device's code you'll have to make is to change `mqttServer` to your server's IP address. Example:
````
#include <Openiot.h>

WifiClient wifi;
Openiot client(wifi, ssid, password, token);

void setup() {
	Serial.begin(9600);
	client.mqttServer = "SERVER_IP_ADDRESS";
	client.begin();
	client.setStream(Serial);
}

void loop() {
	client.loop();
}
````

That's it. If you've run into any problems, open a new issue and let us know.