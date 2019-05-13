<?php
// include database and object files
session_start();
require '../config/vendor/autoload.php';
include_once '../config/HTTP_ORIGIN.php';
include_once '../config/core.php';
include_once '../objects/thing.php';
include_once '../objects/user.php';
include_once '../objects/notification.php';

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

// check for required fields
if (!isset($data -> thingID) || !isset($data -> id)) {
	$core -> output(400,"thingID or id are not set");
}

// check permissions
if (!$thing -> checkPermissions($data -> thingID)) {
	$core -> output(204,"Invalid thing id or insufficiant permissions");
}

// initilize notification object
$notification = new Notification($db, $data -> thingID);

// delete
if ($notification -> remove($data -> id)) {
	$core -> output(200,"Deleted successfully");
}
else {
	$core -> output(500,"Unkown error occurred. Please try again later.");
}