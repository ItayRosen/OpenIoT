# API Documentation
> Programmatically perform operations on your Thing

## Overview
OpenIoT provides REST API that lets you perform various operations on your Things, including read/write operations, reboot, data history, logs and more. The REST API uses HTTP POST requests and header token for authentication.


## Requests
> Input fields in POST request, token in header.

All endpoints requests should follow the following guideline:
* POST method
* TOKEN variable set to your private token in header

## Responses
> JSON response: `response` (response / error code) & `data` (response data)

Following the REST API guidelines, API responses are in JSON format and include response code and associated data. Response codes are one of the following:
* 401: Forbidden access (invalid token)
* 403: Insufficient permissions (not your device / device shared with you and you don't have sufficient permissions)
* 500: Unknown error (issue on our end, if issue persists, let us know)
* 400: Input error (input data you've provided is invalid in some way)
* 204: No content (the data you've tried to get is empty)
* 422: Output error (there's an issue with the data you tried to get)
* 200: Valid response

When presented with a response code which is not `200`, read the associated `data` response.

## Authentication
> `TOKEN` field in headers

Each request has to be authenticated. You authenticate your POST requests with `TOKEN` field inside the request's headers. You can get your API token by going to the [Account Page](https://platform.openiot.xyz/Account). You can generate a new token at any given time.

## Endpoints 
> The base endpoint is `https://api.openiot.xyz/`

The following request endpoints are currently available: 
### `thing/new` - Create a new Thing
* Input fields:

	* `name` - Thing's name (required)
	* `board` - Board type [Options: `esp8266`] (required)
	
### `thing/read` - Read Thing's data
* Input fields:

	* `id` - Thing's ID. If not set, then a list of all Things is returned.
	
* Output fields:

	* `connected` - Whether or not the Thing is connected to the platform. [Options: 1, 0]
	* `access` - Your permissions for the Thing. [Options: 1 (basic), 2 (admin)]
	* `name` - Thing's name
	* `ip` - Thing's IP address on the network
	* `status` - Whether or not it's online [Options: 0 (offline), 1 (online)]
	* `board` - Board type
	* `lastActivity` - Last time the Thing was updated
	* `version` - Code version (if you set it from the library)
	* `createdTime` - Creation date
	* `ports` - Array of attached GPIO
	
		* key/index - Port number
		* `lastActivity` - Last time the port was updated
		* `mode` - Port mode [Options: 0 (INPUT), 1 (OUTPUT)]
		* `type` - Port type [Options: analog, digital]
		* `name` - Port's name as set on the library
		* `value`
		
	* `variables` - Array of attached variables
	
		* key/index - Variable name
		* `lastActivity` - Last time the variable was updated
		* `type` - Variable data type. [Options: `int`, `string`, `char` (array), `float`]
		* `value`
		
	* `functions` - Array of attached functions
	
		* key/index - Function name
		
### `thing/transmit` - Transmit data to Thing
* Input fields:

	* `id` - Thing's ID (required)
	* `action` - The element to which you want to transmit (required). Options: 
	
		* `reboot` - Reboots the device
		* `gpio` - Updates a port's value. Required additional fields in this case:
		
			* `port` - Port number
			* `value` - Value to which you update the port
			
		* `variable` - Updates a variable's value. Required additional fields in this case:
		
			* `variable` - Variable name
			* `type` - Variable data type. [Options: `int`, `string`, `char` (array), `float`]
			* `value` - Value to which you update the variable
			
		* `function` - Executes a function. Required additional fields in this case:
		
			* `value` - Function name

### `thing/readElement` - Read element's data history
* Input fields:

	* `name` - Element's name (required)
	* `thingID` - Thing's unique ID (required)
	
* Output fields:

	* `id` - Entry's unix timestamp
	* `0` - Entry's data
	
## Examples
* Read thing's data: `curl -X POST -H 'TOKEN: API_TOKEN' -v -i 'https://api.openiot.xyz/thing/read?id=THING_ID'`
* Transmit digital HIGH to port a0: `curl -X POST -H 'TOKEN: API_TOKEN' -v -i 'https://api.openiot.xyz/thing/transmit?id=THING_ID&action=gpio&port=a0&value=1'`