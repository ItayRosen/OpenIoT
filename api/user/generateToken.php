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
if (!$user -> authenticate())
{
	$core -> output(409,"User is not logged in.");
}

//update fields
if ($user -> generateToken())
{
	$core -> output(200,$user -> token);
}
else
{
	$core -> output(500,"Error ocurred trying to generate a new token. Please try again later");
}
?>