<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

require('api.php');

class Ads extends Api {

	public function __construct()
	{
		parent::__construct();

		$this->load->model('ads_model', 'ads');
	}

	public function index()
	{
		$latitude = $this->input->post('latitude');
		$longitude = $this->input->post('longitude');
		$location = $this->input->post('location');
		$distance = $this->input->post('distance') ?: 30; // distance in km
		$user = $this->logged->id_objects;
		$liked = $this->input->post('liked') ?: false;
		$related = $this->input->post('related') ?: false;
		$keyword = $this->input->post('keyword') ?: '';
		$transaction = $this->input->post('id_kind_of_transactions') ?: false;
		$condition = $this->input->post('id_kind_of_conditions') ?: false;
		$orderby = $this->input->post('orderby') ?: false;

		if ((!$latitude || !$longitude) && $location)
		{
			// get geolocation by address
			$google = json_decode(file_get_contents('http://maps.googleapis.com/maps/api/geocode/json?address='.urlencode($location).'&sensor=false'));

			if ($google->results)
			{
				$latitude = $google->results[0]->geometry->location->lat;
				$longitude = $google->results[0]->geometry->location->lng;
			}
		}

		echo $this->ads->find($latitude, $longitude, $distance, $user, $liked, $related, $keyword, $transaction, $condition, $orderby);
	}

	public function create()
	{
		$creator = $this->logged->id_objects;

		echo $this->ads->create($creator);
	}

	public function photo()
	{
		echo $this->ads->photo();
	}
}