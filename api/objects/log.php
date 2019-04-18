<?php
class Logs {
	private $thingID;
	private $table;
	private $conn;
	private $reference;
	
    // constructor with database connection
    public function __construct($db, $id){
        $this -> conn = $db;
		$this -> thingID = $id;
		$this -> table = "things/".$id."/logs";
		$this -> reference = $db -> getReference($this -> table);
    }
	
	// read notification
	public function read() {
		$data = $this -> reference -> orderByKey() -> limitToLast(20) -> getValue();
		if (empty($data)) return false;
		return $data;
	}
}