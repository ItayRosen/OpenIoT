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
if (!$user -> isLoggedIn())
{
	$core -> output(401,"User is not logged in");
}

// check required data 
if (!isset($data -> name) || empty($data -> name) || !isset($data -> thingID) || empty($data -> thingID)) {
	$core -> output(400, "Invalid name or thingID");
}

// Check permissions
if (!$thing -> read($data -> thingID))
{
	$core -> output(403,"Invalid thing id or insufficiant permissions");
}

// Get element data
$logs = $thing -> readElement($data->name);

// Validate data
if (empty($logs)) {
	$core -> output(204,"No content");
}

$core -> output(200,$core -> objectToArray($logs));