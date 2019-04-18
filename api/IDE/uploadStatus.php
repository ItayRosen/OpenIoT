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

// check that the data exists
if (!isset($data -> thingID)) {
	$core -> output(400,"Please fill in all fields");
}

// check if the user is logged in
if (!$user -> isLoggedIn())
{
	$core -> output(401,"User is not logged in");
}

// read thing's data
if (!$thing -> read($data -> thingID)) {
	$core -> output(403,"Invalid thing id or insufficiant permissions");
}

// check if there's OTA data
if ($thing -> OTA === null) {
	$core -> output(422,"There is no ongoing OTA update");
}
// check if sketch hash is identical
else if ($thing -> OTA["hash"] == $thing -> sketchHash) {
	$thing -> clearUpload($data -> thingID);
	$core -> output(200,"OTA update finished successfully");
}
// check timeout (3 minutes)
else if ($thing -> OTA["time"] < time()-180) {
	$core -> output(422,"OTA update timed out. Please try again");
}
// check if Thing rejected OTA for some reason..
else if (isset($thing -> OTA["status"]) && $thing -> OTA["status"] == "FAILED") {
	$core -> output(422,"Device has rejected OTA update. Have you forgotten to reset after USB update?");
}
// OTA is ongoing
else {
	$core -> output(204,"OTA update is still ongoing");
}