<?php
// include database and object files
session_start();
require '../config/vendor/autoload.php';
include_once '../config/HTTP_ORIGIN.php';
include_once '../config/core.php';
include_once '../objects/user.php';

// Firebase
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

//verify provider 
$providers = ["google","facebook"];
if (!isset($data -> provider) || !in_array($data -> provider,$providers)) {
	$core -> output(400,"Invalid provider");
}

//validate idToken presence
if (!isset($data -> idToken) || empty($data -> idToken)) {
	$core -> output(400,"Invalid idToken");
}

//validate idToken with social network
switch ($data -> provider) {
	
	case 'google':
		$client = new Google_Client(['client_id' => google_client_id]);
		$payload = $client->verifyIdToken($data -> idToken);
		if ($payload) {
			$id = $payload['sub'];
			$email = $payload['email'];
		}
		else {
			$core -> output(403,"Google token validation failed");
		}
		break;
		
	case 'facebook':
		$data = file_get_contents("https://graph.facebook.com/me?fields=email&access_token=".$data -> idToken);
		$json = json_decode($data);
		$email = urldecode($json -> {"email"}); 
		if (!FILTER_VAR($email,FILTER_VALIDATE_EMAIL)) {
			$core -> output(403,"Facebook token validation failed");
		}
		break;
		
	default:
		$core -> output(403,"Invalid provider");
		break;
		
}

//try to log in
if ($user -> login($email,null,true)) {
	$core -> output(200,"Login successful");
}
//Log in failed, register instead
else if($user -> register($email,null,true)) {
	$core -> output(200,"You have registered successfully");
}
else {
	$core -> output(500,"Error occurred, please try a different method.");
}
?>