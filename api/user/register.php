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
if ($user -> isLoggedIn())
{
	$core -> output(409,["text" => "User is already logged in"]);
}

//validate email
if (!isset($data -> email) || !filter_var($data -> email,FILTER_VALIDATE_EMAIL))
{
	$core -> output(400,["text" => "Please fill in a valid email address", "field" => "email"]);
}

//validate password
if (!isset($data -> password) || strlen($data -> password) < 6 || strlen($data -> password) > 100)
{
	$core -> output(400,["text" => "Password must be between 6 and 100 characters", "field" => "password"]);
}

//check if the email is taken
if ($user -> isEmailTaken($data -> email))
{
	$core -> output(400,["text" => "Email is already in use. Maybe try to log in?", "field" => "email"]);
}

//register user
if ($user -> register($data -> email, $core -> encrypt($data -> password)))
{
	$core -> output(200,["text" => "You have registered successfully. You are not being redirected"]);
}
else
{
	$core -> output(500,["text" => "An unknown error has occurred. Please try again later"]);
}
?>