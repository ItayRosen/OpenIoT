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

//validate token
if (!isset($data -> token))
{
	$core -> output(400,"Reset token is not set");
}

//validate user id 
if (!isset($data -> userID))
{
	$core -> output(400,"User id is not set");
}

//validate password
if (!isset($data -> password) || strlen($data -> password) < 6 || strlen($data -> password) > 30)
{
	$core -> output(400,"Password must be between 6 and 30 characters");
}

//validate token
if (!$user -> validateResetToken($data -> userID, $data -> token))
{
	$core -> output(400,"Invalid token");
}

//delete token
$user -> deleteResetToken($data -> userID, $data -> token);

//reset password
$user -> updatePassword($data -> userID, $core -> encrypt($data -> password));
$core -> output(200,"Password reset successfully");
?>