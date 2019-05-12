<?php
// include database and object files
session_start();
require '../config/vendor/autoload.php';
include_once '../config/HTTP_ORIGIN.php';
include_once '../config/core.php';
include_once '../objects/thing.php';
include_once '../objects/user.php';
include_once '../objects/log.php';

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
if (!$user -> authenticate())
{
	$core -> output(401,"User is not logged in");
}

// check permissions
if (!$thing -> checkPermissions($data -> thingID))
	$core -> output(204,"Invalid thing id or insufficiant permissions");

// initialize object
$log = new Logs($db, $data -> thingID);

$data = $log -> read();
if (!$data) $core -> output(500,"Error getting logs");
//convert to array
$logs = $core -> objectToArray($data);
foreach ($logs as $key => $value) {
	$logs[$key]["data"] = $value[0];
	$logs[$key]["time"] = date("d/m h:i:s",$value["id"]);
	unset($logs[$key][0]);
}
$core -> output(200,$logs);