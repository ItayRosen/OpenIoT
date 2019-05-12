<?php
// include database and object files
session_start();
require '../config/vendor/autoload.php';
include_once '../config/HTTP_ORIGIN.php';
include_once '../config/core.php';
include_once '../objects/thing.php';
include_once '../objects/phpMQTT.php';
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

// check that the data exists
if (!isset($_POST["thingID"]) || !isset($_FILES)) {
	$core -> output(400,"Please fill in all fields");
}

// check file extension
$allowedExtensions = array("bin");
$fileNameSplit = explode(".",$_FILES["file"]["name"]);
end($fileNameSplit);
if (!in_array($fileNameSplit[key($fileNameSplit)],$allowedExtensions)) {
	$core -> output(400,"Invalid file format");
}

// check if the user is logged in
if (!$user -> authenticate())
{
	$core -> output(401,"User is not logged in");
}

// read thing's data
if (!$thing -> read($_POST['thingID'])) {
	$core -> output(403,"Invalid thing id or insufficiant permissions");
}

// check if Thing is offline
if ($thing -> status == 0) {
	$core -> output(422,"Thing is offline");
}

// check that there's enough free space
if ($_FILES["file"]["size"] > $thing -> freeSketchSpace) {
	$core -> output(400,"There is not enough free sketch space for this binary file. Learn how to make space in the Learning section");
}

$hash = md5_file($_FILES["file"]["tmp_name"]);

// check if the firmware has changed
if ($hash == $thing -> sketchHash) {
	$core -> output(400,"New firmware is the same on the device");
}

// upload file
if (isset($_SESSION['OTA_secret']) && $_SESSION['OTA_HASH'] == $hash) {
	$secret = $_SESSION['OTA_secret'];
}
else {
	$secret = bin2hex(openssl_random_pseudo_bytes(10));
	$targetFile = uploads_location.$_POST["thingID"]."_".$secret.".bin";
	if (!move_uploaded_file($_FILES["file"]["tmp_name"], $targetFile)) {
		$core -> output(500,"There was an error uploading the file. Please try again later.");
	}
	//store secret & hash for retry
	$_SESSION['OTA_secret'] = $secret;
	$_SESSION['OTA_HASH'] = $hash;
}

// create mqtt instance
$credentials = json_decode(file_get_contents(mqtt_secret));
$client = new Bluerhinos\phpMQTT($credentials -> ip, $credentials -> port, $credentials -> username);

// send request & secret to Thing to begin OTA
if (!$thing -> upload($client, $credentials -> username, $credentials -> password, $secret, $hash)) {
	$core -> output(500,"There was an error sending the request to your Thing. Please try again later.");
}

// wait for feedback (10 times X 5 sec intervals)
for ($i = 0; $i < 10; $i++) {
	if ($thing -> getFeedback($_POST["thingID"])) {
		$core -> output(200,"Uploading firmware... ");
	}
	else {
		sleep(5);
	}
}

$core -> output(422,"Request timed out. We did not get a response in time. Please try again later.");