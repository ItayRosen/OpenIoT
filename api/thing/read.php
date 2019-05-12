<?php
// include database and object files
session_start();
require '../config/vendor/autoload.php';
include_once '../config/HTTP_ORIGIN.php';
include_once '../config/core.php';
include_once '../objects/thing.php';
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

if (empty($data)) {
	// read my things
	$thingsKeys = $user -> myThings();
	if (empty($thingsKeys))
	{
		$core -> output(204,"No content");
	}
	$data = $thing -> readMultiple($thingsKeys);
	foreach ($data as $key => $value) {
		$data[$key]["lastActivity"] = ($data[$key]["lastActivity"] > 0) ? date("d/m H:i",$data[$key]["lastActivity"]) : "N/A";
	}
	$things = $core -> objectToArray($data);
	$core -> output(200,$things);
}
else {
	// read a thing
	if (!$thing -> read($user -> id, $data -> id))
	{
		$core -> output(403,"Invalid thing id or insufficient permissions");
	}
	// set elements
	$elements = ["connected","access","name","ip","status","board","lastActivity","ports","variables","functions","version","password","createdTime"];
	// update elements 
	$return = [];
	foreach ($elements as $element) {
		$return[$element] = $thing -> $element;
	}
	// object to array
	$return["ports"] = (isset($return["ports"])) ? $core -> objectToArray($return["ports"]) : null;
	$return["variables"] = (isset($return["variables"])) ? $core -> objectToArray($return["variables"]) : null;
	$return["functions"] = (isset($return["functions"])) ? $core -> objectToArray($return["functions"]) : null;
	// set time in readable format 
	$return["lastActivity"] = ($return["lastActivity"] > 0) ? date("d/m H:i",$return["lastActivity"]) : "N/A";
	// return
	$core -> output(200,$return);
}