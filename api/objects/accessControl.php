<?php
class AccessControl {
	private $thingID;
	private $table;
	private $conn;
	private $reference;
	
    // constructor with database connection
    public function __construct($db, $id){
        $this -> conn = $db;
		$this -> thingID = $id;
		$this -> table = "things/".$id."/share";
		$this -> reference = $db -> getReference($this -> table);
    }
	
	// read notification
	public function read() {
		$data = $this -> reference -> getValue();
		if (empty($data)) return false;
		return $data;
	}
	
	// decode rank ID to name
	public function decodeRank($rank) {
		switch ($rank) {
			case 2:
				return "Full Access";
			
			default:
				return "Basic Access";
		}
	}
	
	// check user's access status
	public function checkPermissions($id) {
		$data = $this -> reference -> getChild($id) -> getValue();
		if (empty($data)) return false;
		return true;
	}
	
	// share control
	public function share($userID, $rank) {
		return $this -> reference -> update(array($userID => $rank));
	}
	
	// remove control
	public function remove($id) {
		return $this -> reference -> getChild($id) -> remove();
	}
}