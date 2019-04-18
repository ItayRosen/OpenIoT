<?php
// include database and object files
session_start();
require '../config/vendor/autoload.php';
include_once '../config/HTTP_ORIGIN.php';
include_once '../config/core.php';
include_once '../objects/thing.php';
include_once '../objects/user.php';
include_once '../objects/accessControl.php';

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
if (!isset($data -> thingID) || !isset($data -> id)) {
	$core -> output(400,"Please fill in all fields");
}

// check if the user is logged in
if (!$user -> isLoggedIn())
{
	$core -> output(401,"User is not logged in");
}

// check that the user is not trying to remove himself
if ($data -> id === $_SESSION['ID']) {
	$core -> output(401,"User can not remove himslef");
}

// initialize object
$accessControl = new AccessControl($db, $data -> thingID);

// check permissions
if ($accessControl -> checkPermissions() != 2)
	$core -> output(204,"Invalid thing id or insufficiant permissions");

if ($accessControl -> remove($data -> id)) $core -> output(200,"Access removed successfully");