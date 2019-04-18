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

// check if the user is logged in
if (!$user -> isLoggedIn())
{
	$core -> output(401,"User is not logged in");
}

// initialize object
$accessControl = new AccessControl($db, $data -> thingID);

// check permissions
if (!$accessControl -> checkPermissions())
	$core -> output(204,"Invalid thing id or insufficiant permissions");

$data = $accessControl -> read();
unset($data[0]);
//convert to array
$users = $core -> objectToArray($data);
//decode data
foreach ($users as $key => $value) {
	if ($value["id"] == $_SESSION['ID']) {
		unset($users[$key]);
	}
	else {
		$users[$key] = [
			"email" => $user -> IdToEmail($value["id"]),
			"rank" => $accessControl -> decodeRank($value["0"])
		];
	}
}
if (!$users || empty($users)) {
	$core -> output(204,"No content");
}
$core -> output(200,$users);