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
	$core -> output(409,"User is already logged in");
}

//validate email
if (!isset($data -> email) || !filter_var($data -> email,FILTER_VALIDATE_EMAIL))
{
	$core -> output(400,"Please fill in a valid email address");
}

//check if a email exists in the sytem
if (!$user -> isEmailTaken($data -> email)) {
	$core -> output(400,"Email address does not exist in our database");
}

//get user ID
$userID = $user -> emailToId($data -> email);

//check if a reset link has been sent in the last hour
if ($user -> resetSent($userID)) {
	//$core -> output(400,"Reset password link has been sent already in the last hour.");
}

//send forgot reset link
if ($userID && $user -> forgot($userID))
{
	$core -> output(200,"A link to reset your password has been sent to your email.");
}
else
{
	$core -> output(500,"An unkown problem has occurred, please try again later.");
}
?>