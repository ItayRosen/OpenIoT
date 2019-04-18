<?php
require(__DIR__.'/vendor/autoload.php');
include_once(__DIR__.'/../objects/phpMQTT.php');
include_once(__DIR__.'/constants.php');
$credentials = json_decode(file_get_contents(mqtt_secret));

//Firebase
use Kreait\Firebase\Factory;
use Kreait\Firebase\ServiceAccount;
$serviceAccount = ServiceAccount::fromJsonFile(firebase_secret);
$firebase = (new Factory)->withServiceAccount($serviceAccount)->create();
$db = $firebase->getDatabase();

//create MQTT connection
$mqtt = new Bluerhinos\phpMQTT($credentials -> ip, $credentials -> port, "worker");
//$mqtt -> debug = true;
if ($mqtt->connect(true, NULL, "worker", $credentials -> password)) {
	//subscribe
	$topics["+/out/#"] = array("qos" => 1,"function" => "callback");
//	$topics['$SYS/broker/log/N'] = array("qos" => 1,"function" => "log_callback");
	$mqtt->subscribe($topics,0);
	//handler
	while($mqtt->proc()) {}
	$mqtt->close();
} 
//connection failed
else {
  exit("Connection failed\n");
}

//callback
function callback($topic, $msg){
	
	echo "$topic: $msg\n"; //debug
	
	if (!mb_check_encoding($msg,'UTF-8') || !mb_check_encoding($topic,'UTF-8')) {
		echo "Malformed character\n"; return;
	}
	
	$tree = explode("/",$topic);
	
	if (substr($tree[0],0,1) != "-") return;
	
	$thing = $tree[0];
	$reference = $GLOBALS['db'] -> getReference("things/".$thing);
	$action = $tree[2];
		
	switch ($action) {				
		case "setDPort":
			attachPort($reference, "digital",$msg,$tree[3],$tree[4]);
			break;
			
		case "setAPort":
			attachPort($reference, "analog",$msg,$tree[3],$tree[4]);
			break;
			
		case "version":
			setVersion($reference, $msg);
			break;
			
		case "startup":
			startup($reference, $msg);
			break;
			
		case "port":
			setPort($reference,$tree[3],$msg);
			break;
			
		case "var":
			attachVariable($reference,$thing,$tree[3],$tree[4],$msg);
			break;
			
		case "function":
			attachFunction($reference,$msg);
			break;
			
		case "ok":
			ok($reference);
			break;
			
		case "status":
			status($reference, $msg);
			break;
			
		case "OTA_FAILED":
			ota_failed($reference);
			break;
	}
}

//OTA firmware update failed
function ota_failed($reference) {
	$reference -> update(["OTA/status" => "FAILED"]);
}

//connection status
function status($reference, $status) {
	if (strpos($status,"disconnected") !== FALSE) {
		$updates = [
			"lastActivity" => time(),
			"status" => 0,
			"logs/".time() => "disconnected",
		];
	}
	else if (filter_var($status, FILTER_VALIDATE_IP)) {
		$updates = [
			"lastActivity" => time(),
			"status" => 1,
			"logs/".time() => "connected",
			"ip" => $status
		];
	}
	$reference -> update($updates);
}

//feedback after command transmission
function ok($reference) {
	$updates = [
		"lastActivity" => time(),
		"feedback" => time()
	];
	$reference -> update($updates);
}

//attach a port to Platform
function attachPort($reference, $type, $name, $number, $mode) {
	$updates = [
		"lastActivity" => time(),
		"ports/".$number => ["type" => $type, "name" => $name, "value" => 0, "mode" => intval($mode)]
	];
	$reference -> update($updates);
}

//update port value
function setPort($reference, $port, $value) {
	$updates = [
		"lastActivity" => time(), 
		"ports/".$port."/value" => intval($value),
		"logs/".time() => "Port ".$port." changed to ".$value
	];
	$reference -> update($updates);
}

//attach variable to Platform
function attachVariable($reference, $thing, $type, $name, $value) {
	//set type name
	switch ($type) {
		case 0:
			$typeName = "string";
			break;
		case 1:
			$typeName = "char";
			break;
		case 2:
			$typeName = "int";
			break;
		case 3:
			$typeName = "float";
			break;			
	}
	//transmit value
	$updates = [
		"lastActivity" => time(), 
		"variables/".$name => ["value" => $value, "type" => $typeName]
	];
	$reference -> update($updates);
}

//attach function to Platform
function attachFunction($reference, $name) {
	$updates = [
		"lastActivity" => time(),
		"functions/".$name => 1
	];
	$reference -> update($updates);
}

//set IP address
function setVersion($reference, $version) {
	$updates = [
		"lastActivity" => time(),
		"version" => $version
	];
	$reference -> update($updates);
}

//startup - clear all attachments
function startup($reference, $msg) {
	if (!strpos($msg,"_")) return false;
	list($sketchSize,$freeSketchSpace,$sketchHash) = explode("_",$msg);
	$updates = [
		"lastActivity" => time(),
		"functions" => null,
		"variables" => null,
		"ports" => null,
		"logs/".time() => "reboot",
		"lastRestart" => time(),
		"freeSketchSpace" => intval($freeSketchSpace),
		"sketchSize" => intval($sketchSize),
		"sketchHash" => $sketchHash,
	];
	$reference -> update($updates);
}