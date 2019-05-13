<?php
// include database and object files
session_start();
require '../config/vendor/autoload.php';
include_once '../config/HTTP_ORIGIN.php';
include_once '../config/core.php';
include_once '../objects/thing.php';
include_once '../objects/phpMQTT.php';
include_once '../objects/user.php';

//Firebase
use Kreait\Firebase\Factory;
use Kreait\Firebase\ServiceAccount;
$serviceAccount = ServiceAccount::fromJsonFile(firebase_secret);
$firebase = (new Factory)->withServiceAccount($serviceAccount)->create();
$db = $firebase->getDatabase();
 
// initialize object
$thing = new Thing($db);
$user = new User($db);
$core = new Core;

// get posted data
$data = json_decode(file_get_contents("php://input"));

// check if the user is logged in
if (!$user -> authenticate())
{
	$core -> output(401,"User is not logged in");
}

// validate action
if (!isset($data -> action) || empty($data -> action)) {
	$core -> output(400,"Action is not set");
}

// validate id
if (!isset($data -> id) || empty($data -> id)) {
	$core -> output(400,"ID is not set");
}

// validate value
if (!isset($data -> value) && $data -> action != "reboot") {
	$core -> output(400,"Value is not set");
}

// validate permissions & read data
if (!$thing -> read($user -> id, $data -> id)) {
	$core -> output(403,"Insufficiant permissions");
}

// check if Thing is offline
if ($thing -> status == 0) {
	$core -> output(422,"Thing is offline, transmission aborted");
}

// create mqtt instance
$credentials = json_decode(file_get_contents(mqtt_secret));
$client = new Bluerhinos\phpMQTT($credentials -> ip, $credentials -> port, $credentials -> username);

// switch between actions
switch ($data -> action) {
	case "gpio":
		if (!isset($data -> port)) {
			$core -> output(400,"Port is not set");
		}
		$status = $thing -> transmitGPIO($client, $credentials -> username, $credentials -> password, $data -> port, $data -> value);
		break;
		
	case "function":
		$status = $thing -> transmitFunction($client, $credentials -> username, $credentials -> password, $data -> value);
		break;
		
	case "variable":
		//verify inputs are set 
		if (!isset($data -> variable) || !isset($data -> type)) {
			$core -> output(400,"Variable / Type are not set");
		}
		//verify that value matches type
		if ($data -> type == 2 && !ctype_digit($data -> type)) {
			$core -> output(400, "Variable of type int must be numeric (digits only)");
		}
		else if ($data -> type == 3 && !is_numeric($data -> value)) {
			$core -> output(400, "Variable of type float must be numeric.");
		}
		$status = $thing -> transmitVariable($client, $credentials -> username, $credentials -> password, $data -> variable, $data -> value);
		break;
		
	case "reboot":
		$status = $thing -> transmitReboot($client, $credentials -> username, $credentials -> password);
		break;
		
	default:
		$core -> output(400,"Invalid action");
		break;
}

if ($status) {
	//read feedback (try 10 times, 2 sec interval).
	for ($i = 0; $i < 10; $i++) {
		if ($thing -> getFeedback($data -> id)) {
			$core -> output(200,"Transmission successful.");
		}
		else {
			sleep(2);
		}
	}
	$core -> output(422,"Connection timed out to Thing.");
}
$core -> output(500,"Connection error occurred, please try again later.");