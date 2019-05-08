<?php
class Thing {
	private $table = "things";
	private $conn;
	private $reference;
	
    // object properties
	public $name;
	public $ip;
	public $status;
	public $connected;
	public $board;
	public $lastActivity;
	public $id = 0;
	public $access;
	public $ports;
	public $variables;
	public $functions;
	public $version;
	public $freeSketchSpace = 0;
	public $sketchSize;
	public $sketchHash;
	public $password;
	public $createdTime;
	
    // constructor with $db as database connection
    public function __construct($db){
        $this -> conn = $db;
    }
	
	// read thing's data
	public function read($id) {
		//set reference 
		$reference = $this -> conn -> getReference($this -> table."/".$id);
		//read
		$data = $this -> conn -> getReference($this -> table."/".$id) -> getValue();
		if (!$data || !isset($data["share"][$_SESSION['ID']])) return false;
		$this -> id = $id;
		//elements to read
		$elements = ["name","ip","status","board","lastActivity","ports","variables","functions","version","password","freeSketchSpace","sketchSize","sketchHash","OTA","password","createdTime"];
		//remove 0 indexed port
		if (isset($data["ports"][1])) {
			unset($data["ports"][0]);
		}
		//update elements 
		foreach ($elements as $element) {
			$this -> $element = (!isset($data[$element])) ? null : $data[$element];
		}
		//add access permissions
		$this -> access = $data["share"][$_SESSION['ID']];
		//update connection status
		$this -> connected = ($this -> lastActivity > 0) ? 1 : 0;
		return true;
	}
	
	// update thing's data
	public function update($elements) {
		// set reference 
		$reference = $this -> conn -> getReference($this -> table."/".$elements["id"]);
		// remove id from elements array
		unset($elements["id"]);
		// update and return
		return $reference -> update($elements);
	}
	
	// delete thing
	public function delete($id) {
		$reference = $this -> conn -> getReference($this -> table."/".$id);
		return $reference -> remove();
	}
	
	// read multiple things
	public function readMultiple($ids) {
		$elements = ["name","ip","status","lastActivity","board"];
		$i = 0;
		foreach ($ids as $id) {
			if ($this -> checkPermissions($id)) {
				$things[$i]["ID"] = $id;
				$data = $this -> conn -> getReference($this -> table."/".$id) -> getValue();
				$things[$i]["connected"] = ($data["lastActivity"] > 0) ? 1 : 0;
				foreach ($elements as $element) {
					$things[$i][$element] = $data[$element];
				}
			}
			$i++;
		}
		return $things;
	}
	
	// validate board
	public function validateBoard($board) {
		$boards = ["esp8266"];
		if (in_array($board,$boards)) {
			return true;
		}
		else {
			return false;
		}
	}
	
	// validate name
	public function validateName($name) {
		if (strlen($name) < 3 || strlen($name) > 20) {
			return false;
		}
		return true;
	}
	
	// new thing
	public function newThing($name, $board) {
		//create password
		$password = bin2hex(openssl_random_pseudo_bytes(10));
		//create new key and reference 
		$id = $this -> conn -> getReference($this -> table) -> push() -> getKey();
		//set data
		$this -> id = $id;
		$this -> board = $board;
		$this -> createdTime = time();
		$this -> ip = "";
		$this -> lastActivity = 0;
		$this -> name = $name;
		$this -> password = $password;
		$this -> status = 0;		
		//update
		$elements = ["board","createdTime","ip","lastActivity","name","password","status"];
		foreach ($elements as $element) {
			$thing[$element] = $this -> $element;
		}
		//set sharing & insert log
		$thing["share"][$_SESSION['ID']] = 2;
		$thing["logs"][time()] = "Thing created successfully";
		//update DB
		$updates = [
			$this -> table.'/'.$id => $thing,
			'users/'.$_SESSION['ID'].'/things/'.$id => true
		];
		$this -> conn -> getReference() -> update($updates);
		//add to mosquitto
		exec("sudo /home/addUser.sh ".$id." ".$password);
		return $id;
	}
	
	// check permissions
	public function checkPermissions($id) {
		return ($this -> conn -> getReference($this -> table."/".$id."/share/".$_SESSION['ID']) -> getSnapshot() -> exists());
	}
	
	// get thing's password
	public function getPassword() {
		return $this -> password;
	}
	
	// transmit GPIO
	public function transmitGPIO($client, $username, $password, $port, $value) {
		//check permissions
		if ($this -> id === 0) return false;
		//connect
		if ($client -> connect(true, NULL, $username, $password)) {
			//build payload
			$payload = "";
			$payload .= $port;
			$payload .= "/";
			$payload .= $value;
			//publish
			$client -> publish($this -> id."/in/gpio", $payload, 1);
			$client -> close();
			return true;
		}
		else {
			return false;
		}
	}
	
	// transmit variable
	public function transmitVariable($client, $username, $password, $variable, $value) {
		//check permissions
		if ($this -> id === 0) return false;
		//connect
		if ($client -> connect(true, NULL, $username, $password)) {
			//publish
			$client -> publish($this -> id."/in/variable/".$variable, $value, 1);
			$client -> close();
			return true;
		}
		else {
			return false;
		}
	}
	
	// execute Function
	public function transmitFunction($client, $username, $password, $value) {
		//check permissions
		if ($this -> id === 0) return false;
		//connect
		if ($client -> connect(true, NULL, $username, $password)) {
			//publish
			$client -> publish($this -> id."/in/function", $value, 1);
			$client -> close();
			return true;
		}
		else {
			return false;
		}
	}
	
	// reboot device
	public function transmitReboot($client, $username, $password) {
		//check permissions
		if ($this -> id === 0) return false;
		//connect
		if ($client -> connect(true, NULL, $username, $password)) {
			//publish
			$client -> publish($this -> id."/in/reboot", "1", 1);
			$client -> close();
			return true;
		}
		else {
			return false;
		}
	}
	
	// transmission feedback
	public function getFeedback($id) {
		$time = $this -> conn -> getReference($this -> table."/".$id."/feedback") -> getValue();
		if ($time && $time > time() - 30) {
			$this -> conn -> getReference($this -> table."/".$id."/feedback") -> set(0);
			return true;
		}
		return false;
	}
	
	// send upload OTA requet to thing
	public function upload($client, $username, $password, $secret, $hash) {
		//verify ID
		if ($this -> id === 0) return false;
		//update OTA status
		$updates = [
			"time" => time(),
			"hash" => $hash,
			"secret" => $secret
		];
		if (!$this -> conn -> getReference($this -> table."/".$this -> id."/OTA") -> update($updates)) return false;
		//connect
		if ($client -> connect(true, NULL, $username, $password)) {
			//publish
			$client -> publish($this -> id."/in/update", $secret, 1);
			$client -> close();
			return true;
		}
		else {
			return false;
		}
	}
	
	// clear OTA update after it's finished 
	public function clearUpload() {
		//verify ID
		if ($this -> id === 0) return false;
		//delete file
		$secret = $this -> conn -> getReference($this -> table."/".$this -> id."/OTA/secret") -> getValue();
		$filename = uploads_location.$this -> id."_".$secret.".bin";
		if (file_exists($filename)) {
			unlink($filename);
		}
		//update
		return $this -> conn -> getReference($this -> table."/".$this -> id."/OTA") -> remove();
	}
	
	//read element's logs
	public function readElement($name) {
		return $this -> conn -> getReference("logs/".$this -> id."/".$name) -> getValue();
	}
}