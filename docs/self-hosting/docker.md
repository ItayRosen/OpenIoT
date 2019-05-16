# Self-Hosting with Docker

## Current Roadmap for Docker Supported Installation

The current plan is to provide a MVP consisting of a docker-compose based installation.
The MVP will still require firebase, and will utilize letsencrypt for creating SSL certificates.
Tentative plans are in place to further provide k8s/helm support, and localized cert creation/bring your
own certs.

It's possible in the future additional backends will be provided as alternatives to firebase, and any docker
supported installs will be updated to provide those options.


## Docker-based network map

```
              frontproxy
                  |       
                  |         
                  |          
  firebase --- openiot ---- MQTT 
                  |          | 
                  |          | 
                  |          | 
              mqtt-broker  --
```

## Currently Implemented

- [frontproxy](#frontproxy)


### Frontproxy

The `frontproxy` services provides many services in your setup:

- creation of TLS certificates for the front-end
- obfuscation of the location of the OpenIoT server
- isolates authentication and communication for MQTT to a separate sub-network

In the future, there will be many more benfits this `frontproxy` will provide, mostly
related to scalability, uptime during upgrades, and 

## Usage


```
git clone https://github.com/ItayRosen/OpenIoT.git
cd OpenIoT
docker-compose up -d
```

### Configuration

Most configuration can be provided either via shell environment variables, the
default `.env` docker environment file, or by the specified environment
file for each individual service.  Service specific environment files
are located at `openiot/env/<service>.env`. You will need to create the `env`
directory and service files yourselves.

Config variables and usages for each are listed in the tables below:

**frontproxy**

| VARIABLE | DEFAULT | DESCRIPTION |
| -------- | ------- | ----------- |
| PUID | 1000 | |
| GUID | 1000 | |
| TZ | Europe/London | |
| URL | | |
| SUBDOMAINS | openiot | |
| VALIDATION | | |
| DNSPLUGIN | | |
| DUCKDNSTOKEN | | |
| EMAIL | | |
| DHLEVEL | | 2048 |
| ONLY_SUBDOMAINS | | |
| EXTRA_DOMAINS | | |
| STAGING | false | |

Example `/openiot/env/frontproxy.env` file:

```
PUID=1000
PGID=1000
TZ=America/Chicago
URL=openiot.duckdns.org
DHLEVEL=2048
SUBDOMAINS=wildcard,
EXTRA_DOMAINS=openiot.example.com
VALIDATION=duckdns
DUCKDNSTOKEN=abcdefg-1234-1234-abcd-ab1aabab1234
```

