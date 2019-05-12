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

// validate data input
if (!isset($data -> id)) {
	$core -> output(400,"Please set a thing ID");
}

// check for sufficiant permissions
if (!$thing -> read($user -> id, $data -> id)) {
	$core -> output(403,"Insufficiant permissions or invalid thing ID");
}

// update data
if ($thing -> delete($data -> id) && $user -> deleteThing($data -> id)) {
	$core -> output(200,"Thing deleted successfully");
}
else {
	$core -> output(500,"An unknown error has occurred");
}