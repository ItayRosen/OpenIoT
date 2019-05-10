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

// check if the user is logged in
if (!$user -> isLoggedIn())
{
	$core -> output(401,"User is not logged in");
}

// get posted data
$data = json_decode(file_get_contents("php://input"));

// check if all fields are set
if (!isset($data -> name) || !isset($data -> board) || empty($data -> name) || empty($data -> board))
{
	$core -> output(400,"Please fill in all fields");
}

// validate name
if (!ctype_alnum($data -> name)) {
	$core -> output(400,"Please only use letters and digits");
}

// validate board
if (!$thing -> validateBoard($data -> board)) {
	$core -> output(400,"This board is currently not supported");
}

// create a new thing
$thingID = $thing -> newThing($user -> id, $data -> name, $data -> board);
if ($thingID) {
	$core -> output(200,"Thing has been created successfully",$thingID);
}
else {
	$core -> output(500,"An unknown error has occurred. Please try again later");
}