<?php
class User {
	private $table = "users";
	private $conn;
	private $reference;
	
    // object properties
	private $password;
	public $id;
    public $email;
    public $registrationDate;
    public $lastActivity;
    public $rank;
	public $things;
	
    // constructor with $db as database connection
    public function __construct($db){
        $this -> conn = $db;
		//platform
		if (isset($_SESSION['ID'])) {
			$this -> id = $_SESSION['ID'];
			$this -> reference = $this -> conn -> getReference($this -> table.'/'.$this -> id);
		}
		//api
		else if (isset($_SERVER['HTTP_TOKEN'])) {
			$data = $this -> conn -> getReference($this -> table) -> orderByChild("token") -> equalTo($_SERVER['HTTP_TOKEN']) -> getValue();
			$this -> id = key($data);
			$this -> reference = $this -> conn -> getReference($this -> table.'/'.$this -> id);
		}
		else {
			$this -> reference = $this -> conn -> getReference($this -> table);
		}
    }
	
	//authenticate request (user session / api token)
	public function authenticate() {
		if (isset($_SESSION['ID']) || isset($_SERVER['HTTP_TOKEN']))
		{
			return ($this -> reference -> getSnapshot() -> exists());
		}
		return false;
	}
	
	//read user's data
	public function read() {
		$data = $this -> reference -> getValue();
		if (!$data) return false;
		$this -> email = $data["email"];
		$this -> rank = $data["rank"];
		$this -> lastActivity = $data["lastActivity"];
		$this -> registrationDate = $data["registrationDate"];
		$this -> things = $data["things"];
		return true;
	}
	
	//log in
	public function login($email,$password,$social = false)
	{
		//get data
		$data = $this -> reference -> orderByChild("email") -> equalTo($email) -> getValue();
		//compare password
		if ($data && ($social || $data[key($data)]["password"] == $password)) {
			$_SESSION['ID'] = key($data);
			$this -> logLogin(true,$email);
			return true;
		}
		else {
			$this -> logLogin(false,$email);
			return false;
		}
	}
	
	//register
	public function register($email,$password,$social = false)
	{
		//create key
		$id = $this -> conn -> getReference($this -> table) -> push() -> getKey();
		//set data
		$this -> id = $id;
		$this -> email = $email;
		$this -> password = ($social) ? bin2hex(openssl_random_pseudo_bytes(10)) : $password;
		$this -> lastActivity = time();
		$this -> rank = 1;
		$this -> registrationDate = time();
		//update data
		$elements = ["email","password","lastActivity","rank","registrationDate"];
		foreach ($elements as $element) {
			$user[$element] = $this -> $element;
		}
		$updates = [
			$this -> id => $user
		];
		//return
		if ($this -> reference -> update($updates)) {
			$_SESSION['ID'] = $this -> id;
			return true;
		}
		return false;
	}
	
	//update password
	public function setPassword($password) {
		$this -> password = $password;
	}
	
	//update password
	public function updatePassword($userid, $password) {
		return $this -> conn -> getReference($this -> table.'/'.$userid.'/password') -> set($password);
	}
	
	//update user data
	public function update($elements) {
		$data = [];
		foreach ($elements as $element) {
			$data[$element] = $this -> $element;
		}
		return $this -> reference -> update($data);
	}
	
	//log log in attempt
	private function logLogin($status,$email)
	{
		$reference = $this -> conn -> getReference("loginLogs");
		$key = $reference -> push() -> getKey();
		$updates = [ 
			$key => ["email" => $email, "status" => $status, "date" => time(), "ip" => client_ip]
		];
		$reference -> update($updates);
	}
	
	//check if email is taken
	public function isEmailTaken($email)
	{
		return ($this -> reference -> orderByChild("email") -> equalTo($email) -> getValue()) ? true : false;
	}
	
	//read the ids of my things
	public function myThings()
	{
		return $this -> reference -> getChild("things") -> getChildKeys();
	}
	
	//log out
	public function logout()
	{
		unset($_SESSION['ID']);
		return true;
	}
	
	//email to user ID
	public function emailToId($email) {
		$user = $this -> conn -> getReference($this -> table) -> orderByChild("email") -> equalTo($email) -> limitToFirst(1) -> getValue();
		unset($user[0]); //remove null element
		if (empty($user)) return false;
		return key($user);
	}
	
	//user ID to email
	public function IdToEmail($id) {
		return $this -> conn -> getReference($this -> table."/".$id."/email") -> getValue();
	}
	
	//delete thing ID from user
	public function deleteThing($id) {
		error_log($this -> id,3,"error.log");
		return $this -> conn -> getReference($this -> table."/".$this -> id."/things/".$id) -> remove();
	}
	
	//forgot password - send reset link to user's email
	public function forgot($id) {
		$updates = [
			"time" => time(),
			"token" => bin2hex(openssl_random_pseudo_bytes(10))
		];
		return $this -> conn -> getReference($this -> table."/".$id."/reset") -> update($updates);
	}
	
	//check if a reset password link was sent in the last 1 hour
	public function resetSent($id) {
		$time = $this -> conn -> getReference($this -> table."/".$id."/reset/time") -> getValue();
		return ($time && $time > time() - 3600);
	}
	
	//validate reset token
	public function validateResetToken($userid, $token) {
		$_token = $this -> conn -> getReference($this -> table."/".$userid."/reset/token") -> getValue();
		return ($_token == $token) ? true : false;
	}
	
	//delete reset token
	public function deleteResetToken($userid, $token) {
		return $this -> conn -> getReference($this -> table."/".$userid."/reset") -> remove();
	}
	
	//check if user ip is banned
	public function isBanned() {
		$data = $this -> conn -> getReference("banIP") -> orderByChild("ip") -> equalTo(client_ip) -> limitToFirst(1) -> getValue();
		if ($data[key($data)]["date"] > time() - 60 * 10) {
			return true;
		}
		else {
			$this -> conn -> getReference("banIP/".key($data)) -> remove();
			return false;
		}
	}
}