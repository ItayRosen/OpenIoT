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
if ($user -> authenticate())
{
	$core -> output(409,["text" => "User is already logged in"]);
}

//validate email
if (!isset($data -> email) || !filter_var($data -> email,FILTER_VALIDATE_EMAIL))
{
	$core -> output(400,["text" => "Please fill in a valid email address", "field" => "email"]);
}

//validate password
if (!isset($data -> password) || strlen($data -> password) < 6)
{
	$core -> output(400,["text" => "Please fill in a valid password", "field" => "password"]);
}

//login security - check if IP is banned
if ($user -> isBanned()) {
	$core -> output(400,["text" => "Too many failed attempts. Please try again in a few minutes."]);
}

//try to log in
if ($user -> login($data -> email, $core -> encrypt($data -> password)))
{
	$core -> output(200,["text" => "You have logged in successfully. You are now being redirected."]);
}
else
{
	$core -> output(401,["text" => "Email and password do not match", "field" => "password"]);
}
?>