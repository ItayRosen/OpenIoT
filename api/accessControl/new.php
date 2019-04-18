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
if (!isset($data -> thingID) || !isset($data -> email) || !isset($data -> permission)) {
	$core -> output(400,"Please fill in all fields");
}

//validate email address
if (!FILTER_VAR($data -> email, FILTER_VALIDATE_EMAIL)) {
	$core -> output(401,"Email address is invalid");
}

//validate rank
if ($data -> permission !== 1 && $data -> permission !== 2) {
	$core -> output(401,"Invalid permission");
}

// check if the user is logged in
if (!$user -> isLoggedIn())
{
	$core -> output(401,"User is not logged in");
}

// initialize object
$accessControl = new AccessControl($db, $data -> thingID);

// check permissions
if ($accessControl -> checkPermissions() != 2)
	$core -> output(204,"Invalid thing id or insufficiant permissions");

// check that there's a user with this email address
$id = $user -> emailToId($data -> email);
if (!is_numeric($id) || empty($id)) {
	$core -> output(401,"There is no user attached to this email address");
}

if ($accessControl -> share($id, $data -> permission)) $core -> output(200,"Access shared successfully");