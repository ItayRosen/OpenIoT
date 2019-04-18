<?php
class Notification {
	private $thingID;
	private $table;
	private $conn;
	private $reference;
	
    // constructor with database connection
    public function __construct($db, $id){
        $this -> conn = $db;
		$this -> thingID = $id;
		$this -> table = "things/".$id."/notifications";
		$this -> reference = $db -> getReference($this -> table);
    }
	
	// read all notifications
	public function readAll() {
		$data = $this -> reference -> getValue();
		if (empty($data)) return false;
		return $data;
	}
	
	// read notification
	public function read($id) {
		$data = $this -> reference -> getChild($id) -> getValue;
		if (empty($data)) return false;
		return $data;
	}
	
	// update notification
	public function update($data,$id) {
		$update = [
			"name" => $data -> name,
			"trigger" => $data -> trigger,
			"triggerValue" => strval($data -> triggerValue),
			"triggerOperation" => $data -> triggerOperation,
			"triggerOperationValue" => $data -> triggerOperationValue,
			"action" => $data -> action,
			"actionValue" => $data -> actionValue,
		];
		return $this -> reference -> getChild($id) -> update($update);
	}
	
	// check if the name is already in use
	public function isNameTaken($name) {
		return (!empty($this -> reference -> orderByChild("name") -> equalTo($name) -> getValue()));
	}
	
	// new notification
	public function create($data) {
		$id = $this -> reference -> push() -> getKey();
		$update = [
			"name" => $data -> name,
			"trigger" => $data -> trigger,
			"action" => $data -> action,
			"actionValue" => $data -> actionValue,
			"lastActivity" => 0,
			"lastStatus" => 0,
		];
		switch ($data -> trigger) {
			case "GPIO":
				$update["triggerValue"] = strval($data -> triggerValue);
				break;
			
			case "VARIABLE":
				$update["triggerValue"] = strval($data -> triggerValue);
				$update["triggerOperation"] = $data -> triggerOperation;
				$update["triggerOperationValue"] = $data -> triggerOperationValue;
		}
		return $this -> reference -> getChild($id) -> update($update);
	}
	
	// delete notification
	public function remove($id) {
		return $this -> reference -> getChild($id) -> remove();
	}
	
	// check for duplicate notification
	public function isDuplicate($trigger,$triggerValue) {
		$notification = $this -> reference -> orderByChild("trigger") -> equalTo($trigger) -> getValue();
		if ($notification && $this -> triggerValue == $triggerValue) return true;
		return false;
	}
}