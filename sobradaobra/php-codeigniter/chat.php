<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

require('api.php');

class Chat extends Api {

	public function __construct()
	{
		parent::__construct();

		$this->load->model('messages_model', 'messages');
	}

	public function index()
	{
		$idLogged = $this->logged->id_objects;

		echo $this->messages->chat($idLogged);
	}

	public function read()
	{
		$id = $this->input->post('id');
		$before = $this->input->post('before_at');
		$after = $this->input->post('after_at');
		$idLogged = $this->logged->id_objects;

		echo $this->messages->conversation($id, $idLogged, $before, $after);
	}

	public function send()
	{
		$id = $this->input->post('id');
		$idLogged = $this->logged->id_objects;
		$message = $this->input->post('message');

		echo $this->messages->send($idLogged, $id, $message);
	}
}