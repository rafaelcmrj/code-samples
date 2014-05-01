<?php 

class Ads_model extends Abstract_model
{
	public function __construct()
	{
		parent::__construct();
	}

	public function create($creator)
	{
		$params = $this->input->post(NULL, TRUE);

		$_POST['id_objects'] = parent::createObject(KIND_OF_OBJECTS_ADS);

		$_POST['price'] = str_replace(array('.', ','), array('', '.'), $_POST['price']);

		$_POST['id_creator'] = $creator;

		// get geolocation by address
		$google = json_decode(file_get_contents('http://maps.googleapis.com/maps/api/geocode/json?address='.urlencode($params['address']).'&sensor=false'));

		if ($google->results)
		{
			$_POST['lat'] = $google->results[0]->geometry->location->lat;
			$_POST['long'] = $google->results[0]->geometry->location->lng;
		}

		if ($_POST['lat'] && $_POST['long'])
		{
			$google = json_decode(file_get_contents('http://maps.googleapis.com/maps/api/geocode/json?latlng='.$_POST['lat'].','.$_POST['long'].'&sensor=false'));

			if ($google->results)
			{
				$addressComponents = $google->results[0]->address_components;

				foreach ($addressComponents as $component)
				{
					if (in_array('route', $component->types))
					{
						$_POST['route'] = $component->short_name;
					}
					else if (in_array('street_number', $component->types))
					{
						$_POST['street_number'] = $component->short_name;
					}
					else if (in_array('neighborhood', $component->types))
					{
						$_POST['neighborhood'] = $component->short_name;
					}
					else if (in_array('administrative_area_level_2', $component->types))
					{
						$_POST['city'] = $component->short_name;
					}
					else if (in_array('administrative_area_level_1', $component->types))
					{
						$_POST['state'] = $component->short_name;
					}
					else if (in_array('country', $component->types))
					{
						$_POST['country'] = $component->short_name;
					}
					else if (in_array('postal_code', $component->types))
					{
						$_POST['postal_code'] = $component->short_name;
					}
				}
			}
		}

		return parent::create('ads');
	}

	public function photo()
	{
		$id = $this->input->post('id');
		$image = base64_decode($this->input->post('photo'));

		unset($_POST['id']);
		unset($_POST['photo']);

		$f = finfo_open();

		$mimeType = finfo_buffer($f, $image, FILEINFO_MIME_TYPE);

		$path = md5(uniqid(rand(), true)) . get_extension($mimeType);

		file_put_contents(UPLOAD_PATH . $path, $image);

		$_POST = array();

		$_POST['id_objects'] = parent::createObject(KIND_OF_OBJECTS_PHOTOS);

		$_POST['path'] = $path;

		parent::create('photos');

		$_POST = array();

		$_POST['id_ads'] = $id;
		$_POST['id_photos'] = $this->db->insert_id();

		echo parent::create('ads_has_photos');
	}

	public function find($latitude = '', $longitude = '', $distance = '', $user = '', $liked = false, $related = false, $keyword = '', $transaction = false, $condition = false, $orderby = false)
	{
		$this->db->_protect_identifiers = false;

		unset($_POST['latitude']);
		unset($_POST['longitude']);
		unset($_POST['location']);
		unset($_POST['distance']);
		unset($_POST['liked']);
		unset($_POST['related']);
		unset($_POST['keyword']);
		unset($_POST['id_kind_of_transactions']);
		unset($_POST['id_kind_of_conditions']);
		unset($_POST['orderby']);

		$this->db->select('ads.id, ads.title, ads.description, ads.lat as latitude, ads.long as longitude, ads.id_kind_of_transactions, ads.id_kind_of_conditions, IF (ads.neighborhood IS NOT NULL, ads.neighborhood, CONCAT_WS(", ", ads.city, ads.state)) as location, ads.id_objects, CONCAT("' . UPLOAD_URL . '", photos.path) as image, GROUP_CONCAT(DISTINCT CONCAT("' . UPLOAD_URL . '", photos.path)) as images, REPLACE(REPLACE(REPLACE(Format(ads.price, 2), ".", "|"), ",", "."), "|", ",") as price, users.name as author, users.telephone as author_telephone, objects.email as author_email, users.id_objects as id_objects_users, (CASE WHEN LOCATE("http", user_photos.path) > 0 THEN user_photos.path ELSE CONCAT("' . UPLOAD_URL . '", user_photos.path) END)  as author_photo, liked.active as liked, complaints.active as complainted', FALSE);
		
		$this->db->limit(500);

		if ($latitude && $longitude && $distance)
		{
			$this->db->where('ads.lat >', $latitude - ($distance/100));
			$this->db->where('ads.lat <', $latitude + ($distance/100));
			$this->db->where('ads.long >', $longitude - ($distance/100));
			$this->db->where('ads.long <', $longitude + ($distance/100));
		}

		if ($user)
		{
			$this->db->join('liked', 'liked.id_objects_to = ads.id_objects AND liked.id_objects_from = '.$user, 'left');
			$this->db->join('complaints', 'complaints.id_objects_to = ads.id_objects AND complaints.id_objects_from = '.$user, 'left');
		}

		if ($liked)
		{
			$this->db->where('liked.active', 1);
		}

		if ($keyword)
		{
			$this->db->where('(ads.title LIKE "%'.$keyword.'%" OR ads.description LIKE "%'.$keyword.'%" OR ads.address LIKE "%'.$keyword.'%" OR ads.route LIKE "%'.$keyword.'%" OR ads.neighborhood LIKE "%'.$keyword.'%" OR ads.city LIKE "%'.$keyword.'%" OR ads.state LIKE "%'.$keyword.'%" OR ads.country LIKE "%'.$keyword.'%" OR users.name LIKE "%'.$keyword.'%")');
		}

		if ($transaction)
		{
			$this->db->where('ads.id_kind_of_transactions', $transaction);
		}

		if ($condition)
		{
			$this->db->where('ads.id_kind_of_conditions', $condition);
		}

		if ($orderby)
		{
			if ($orderby == 1)
			{
				$this->db->select('( ('.($latitude < 0 ? $latitude * -1 : $latitude) .' - (IF (ads.lat < 0, ads.lat * -1, ads.lat))) + ('.($longitude < 0 ? $longitude * -1 : $longitude) .' - (IF (ads.long < 0, ads.long * -1, ads.long))) ) as diff_distance');
				$this->db->order_by('diff_distance', 'asc');
			}
			else if ($orderby == 2)
			{
				$this->db->order_by('ads.price', 'asc');
			}
			else if ($orderby == 3)
			{
				$this->db->order_by('ads.price', 'desc');
			}
			else if ($orderby == 4)
			{
				$this->db->select('(SUM(reviews.rate)/COUNT(reviews.rate)) as rate');
				$this->db->join('reviews', 'reviews.id_objects_to = ads.id_objects', 'left');
				$this->db->order_by('rate', 'desc');
			}
		}

		if ($related)
		{
			$this->db->join('ads as related', 'related.id = ' . $_POST['id'], 'left');

			$this->db->select('levenshtein(ads.title, related.title) as related_distance', FALSE);

			$this->db->where('ads.id != related.id');

			$this->db->order_by('related_distance', 'asc');

			$this->db->limit(10);

			unset($_POST['id']);
		}

		$this->db->join('ads_has_photos', 'ads_has_photos.id_ads = ads.id', 'left');
		$this->db->join('photos', 'photos.id = ads_has_photos.id_photos', 'left');
		$this->db->join('users', 'users.id_objects = ads.id_creator', 'left');
		$this->db->join('objects', 'objects.id = users.id_objects', 'left');
		$this->db->join('users_has_photos', 'users_has_photos.id_users = users.id', 'left');
		$this->db->join('photos as user_photos', 'user_photos.id = users_has_photos.id_photos', 'left');

		$this->db->group_by('ads.id');

		return parent::find('ads', true);
	}
}

 ?>