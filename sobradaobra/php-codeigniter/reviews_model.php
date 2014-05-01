<?php 

class Reviews_model extends Abstract_model
{
	public function __construct()
	{
		parent::__construct();
	}

	public function find($to)
	{
		$this->db->select('reviews.rate, reviews.comment, users.name,
			IF (photos.path IS NOT NULL, (CASE WHEN LOCATE("http", photos.path) > 0 THEN photos.path ELSE CONCAT("' . UPLOAD_URL . '", photos.path) END), "/images/avatar.jpg") as photo
		', FALSE);

		$this->db->join('users', 'users.id_objects = reviews.id_objects_from', 'left');
		$this->db->join('users_has_photos', 'users_has_photos.id_users = users.id AND users_has_photos.current = 1', 'left');
		$this->db->join('photos', 'photos.id = users_has_photos.id_photos', 'left');

		$this->db->where('reviews.id_objects_to', $to);
		$this->db->where('reviews.active', 1);

		$this->db->order_by('reviews.created', 'desc');

		$this->db->group_by('reviews.id_objects_from');

		return parent::find('reviews', true);
	}

	public function create($to)
	{
		$_POST['id_objects_to'] = $to;
		return parent::create('reviews');
	}
}

 ?>