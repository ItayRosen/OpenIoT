<?php
include_once('constants.php');

class Core {
	
	private $encryption_key = 'juhf9832hyufg2dhdsougf2jnhdb';
	public  $publicURL      = 'http://localhost:4200/';
	
	public function encrypt($query)
	{
		return hash('sha256', $query);
	}
	
	public function two_way_encrypt($string)
	{
		  $enc_method = 'AES-128-CTR';
		  $enc_iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($enc_method));
		  $crypted_token = openssl_encrypt($string, $enc_method, $this -> encryption_key, 0, $enc_iv) . "::" . bin2hex($enc_iv);
		  return $crypted_token;
	}
	
	public function two_way_decrypt($string)
	{
		  if(preg_match("/^(.*)::(.*)$/", $string, $regs)) {
			list(, $crypted_token, $enc_iv) = $regs;
			$enc_method = 'AES-128-CTR';
			$decrypted_token = openssl_decrypt($crypted_token, $enc_method, $this -> encryption_key, 0, hex2bin($enc_iv));
		  }
		  return $decrypted_token;
	}
	
	public function output($response, $data, $id = null)
	{
		//log
		if ($response == 500) {
			$this -> logError($data);
		}
		
		$output = array("response" => $response, "data" => $data);
		if ($id !== null) $output['id'] = $id;
		die(json_encode($output));
	}
	
	public function logError($error)
	{
		error_log(time()." | ".$_SERVER['REQUEST_URI']." | ".$error."\n", 3, debug_location);
	}
	
	public function objectToArray($objects) {
		$i = 0;
		$array = [];
		foreach ($objects as $key => $object) {			
			$array[$i] = (array)$object;
			$array[$i]["id"] = $key;
			$i++;
		}
		return $array;
	}
}