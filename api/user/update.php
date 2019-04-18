<?php
// include database and object files
session_start();
require '../config/vendor/autoload.php';
include_once '../config/HTTP_ORIGIN.php';
include_once '../config/core.php';
include_once '../objects/user.php';

//Firebase
use Kreait\Firebase\Factory;
use Kreait\Firebase\ServiceAccount;
$serviceAccount = ServiceAccount::fromJsonFile(firebase_secret);
$firebase = (new Factory)->withServiceAccount($serviceAccount)->create();
$db = $firebase->getDatabase();
 
// initialize object
$user = new User($db);
$core = new Core;

// get posted data
$data = json_decode(file_get_contents("php://input"));
 
//check if the user is logged in
if (!$user -> isLoggedIn())
{
	$core -> output(409,"User is not logged in.");
}

$elements = [];

//validate password
if (isset($data -> password))
{
	if (strlen($data -> password) < 6 || strlen($data -> password) > 30) {
		$core -> output(400,"Please fill in a valid password");
	}
	else {
		$elements[] = "password";
		$user -> setPassword($core -> encrypt($data -> password));
	}
}

//make sure elements were set
if (empty($elements)) {
	$core -> output(400,"No fields were set to update");
}

//update fields
if ($user -> update($elements))
{
	$core -> output(200,"Password changed successfully");
}
else
{
	$core -> output(500,"Error ocurred trying to update your password. Please try again later");
}
?>