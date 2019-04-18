<?php
// include database and object files
session_start();
require '../config/vendor/autoload.php';
include_once '../config/HTTP_ORIGIN.php';
include_once '../config/core.php';
include_once '../objects/thing.php';
include_once '../objects/notification.php';
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
if (!isset($data -> name) || empty($data -> name) || !isset($data -> trigger) || empty($data -> trigger) || !isset($data -> action) || empty($data -> action) || !isset($data -> thingID) || empty($data -> thingID))
{
	$core -> output(400,"Please fill in all fields");
}

// validate action
$actions = ["webhook","email"];
if (!in_array($data -> action,$actions)) {
	$core -> output(400,"Unknown Action");
}

// validate trigger
$triggers = ["GPIO","VARIABLE","RESTART","OFFLINE","ONLINE"];
if (!in_array($data -> trigger,$triggers)) {
	$core -> output(400,"Unknown Trigger");
}

// validate email
if ($data -> action == "email" && !filter_var($data -> actionValue,FILTER_VALIDATE_EMAIL)) {
	$core -> output(400,"Email address is invalid");
}

// validate webhook
if ($data -> action == "webhook" && !filter_var($data -> actionValue,FILTER_VALIDATE_URL)) {
	$core -> output(400,"Please enter a valid url for your webhook. Example: http://test.com/webhook.php");
}

// initilize notification object
$notification = new Notification($db, $data -> thingID);

// check if name is taken
if ($data -> id === 0 && $notification -> isNameTaken($data -> name)) {
	$core -> output(400,"You already have a notification with this name. Please pick a different one.");
}

// create notification
if ($data -> id === 0) {
	// check for duplicate
	if ($notification -> isDuplicate($data -> trigger, $data -> triggerValue)) {
		$core -> output(400,"You already have a similar notification");
	}
	// create
	if ($notification -> create($data)) {
		$core -> output(200,"Notification created successfully!");
	}
	else {
		$core -> output(500,"Unknown error occurred. Please try again later.");
	}
}
// update notification
else {
	if ($notification -> update($data, $data -> id)) {
		$core -> output(200,"Notification updated successfully!");
	}
	else {
		$core -> output(500,"Unknown error occurred. Please try again later.");
	}
}