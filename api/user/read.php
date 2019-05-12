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

//check if the user is logged in
if (!$user -> authenticate())
{
	$core -> output(409,"User is not logged in");
}

//check for valid data
if (!$user -> read()) {
	$core -> output(500,"Error reading user data");
}

//choose elements
$elements = ["rank","email","things","token"];
$data = [];
foreach ($elements as $element) {
	$data[$element] = $user -> $element;
}
$core -> output(200,$data);
?>