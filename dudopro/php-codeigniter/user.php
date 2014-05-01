<?php

require("api.php");

class User extends API
{
	public function __construct()
	{
		parent::AbstractController();

		$this->init();
	}

	private function init()
	{
		$this->load->model("UsersDAO");
		$this->load->model("BeltsDAO");
	}

	/**
	 * get user infos
	 * @param int $id [id do usurio]
	 * @return array
	 */
	public function infos()
	{
		$idsUsers = explode(",", $this->input->post("id"));
		$idUserLogged = $this->session->userdata("id");

		$users = array();

		foreach($idsUsers as $idUser)
		{
			$user = array();

			/**
			 * ---
			 * User Infos
			 * ---
			 */
			$sqlUserInfos = "SELECT users.id, users.id_belts as belt, users.fb_name, users.allow_news_on_fb, users.create_date, users.level, users.token_key, users.appear_online, users.id_invitations_types FROM users WHERE users.id = ?";
			$dataUserInfos = array($idUser);
			$userInfos = $this->UsersDAO->convertToBEAN($this->db->query($sqlUserInfos, $dataUserInfos)->row());

			$user["id"] = $userInfos->getAttr("id");
			$user["name"] = $userInfos->getAttr("fbName");
			$user["belt"] = $userInfos->getAttr("belt");
			$user["create_date"] = $userInfos->getAttr("create_date");
			$user["level"] = $userInfos->getAttr("level");

			if ($idUser == $idUserLogged)
			{
				$user["allow_news_on_fb"] = ord($userInfos->getAttr("allowNewsOnFb"));
				$user["token_key"] = $userInfos->getAttr("tokenKey");
				$user["appear_online"] = ord($userInfos->getAttr("appearOnline"));
				$user["id_invitations_types"] = $userInfos->getAttr("idInvitationsTypes");
			}

			$user["performance"] = $this->getRankingPosition($idUser);

			$users[] = $user;
		}

		echo json_encode($users);
	}

	/**
	 * get total_victories, total_defeats, victories_matches, ... from user
	 * @param int $id user id
	 * @param int $id_game_type
	 * @return array
	 */
	public function performance()
	{
		$id = $this->input->post("id");
		$idGameType = $this->input->post("id_game_type");

		$user = array();

		/**
		 * ---
		 * Ranking All Time
		 * ---
		 */
		if ($idGameType)
		{
			$sqlRankingAllTime = "SELECT SUM(general_monthly_ranking.victories) as total_victories, SUM(general_monthly_ranking.defeats) as total_defeats, SUM(general_monthly_ranking.max_undefeated_rounds) as total_max_undefeated_rounds FROM general_monthly_ranking WHERE id_users = ? AND id_game_types = ?";
			$dataSqlRankingAllTime = array($id, $idGameType);
		}
		else
		{
			$sqlRankingAllTime = "SELECT SUM(general_monthly_ranking.victories) as total_victories, SUM(general_monthly_ranking.defeats) as total_defeats, SUM(general_monthly_ranking.max_undefeated_rounds) as total_max_undefeated_rounds FROM general_monthly_ranking WHERE id_users = ?";
			$dataSqlRankingAllTime = array($id);
		}
		$rankingAllTime = $this->UsersDAO->convertToBEAN($this->db->query($sqlRankingAllTime, $dataSqlRankingAllTime)->row());

		$user["total_victories"] = $rankingAllTime->getAttr("totalVictories") ? $rankingAllTime->getAttr("totalVictories") : 0;
		$user["total_defeats"] = $rankingAllTime->getAttr("totalDefeats") ? $rankingAllTime->getAttr("totalDefeats") : 0;
		$user["victories_matches"] = $rankingAllTime->getAttr("totalVictories") ? round($rankingAllTime->getAttr("totalVictories") / $rankingAllTime->getAttr("totalVictories") + $rankingAllTime->getAttr("totalDefeats")) * 100 : 0;
		$user["total_king_of_the_table"] = $rankingAllTime->getAttr("totalMaxUndefeatedRounds") ? $rankingAllTime->getAttr("totalMaxUndefeatedRounds") : 0;


		/**
		 * ---
		 * Ranking Monthly
		 * ---
		 */
		if ($idGameType)
		{
			$sqlRankingMonthly = "SELECT monthly_ranking.victories, monthly_ranking.defeats FROM monthly_ranking WHERE id_users = ? AND id_game_types = ? AND MONTH(monthly_ranking.month_date) = MONTH(CURDATE()) AND YEAR(monthly_ranking.month_date) = YEAR(CURDATE())";
			$dataSqlRankingMonthly = array($id, $idGameType);
		}
		else
		{
			$sqlRankingMonthly = "SELECT monthly_ranking.victories, monthly_ranking.defeats FROM monthly_ranking WHERE id_users = ? AND MONTH(monthly_ranking.month_date) = MONTH(CURDATE()) AND YEAR(monthly_ranking.month_date) = YEAR(CURDATE())";
			$dataSqlRankingMonthly = array($id);
		}
		$rankingMonthly = $this->UsersDAO->convertToBEAN($this->db->query($sqlRankingMonthly, $dataSqlRankingMonthly)->row());

		$user["victories_month"] = $rankingMonthly->getAttr("victories") ? $rankingMonthly->getAttr("victories") : 0;
		$user["defeats_month"] = $rankingMonthly->getAttr("defeats") ? $rankingMonthly->getAttr("defeats") : 0;

		echo json_encode($user);
	}

	/**
	 * get belts of user
	 * @param int $id
	 * @return array
	 */
	public function belts()
	{
		$id = $this->input->post("id");

		$user = array();

		/**
		 * ---
		 * Belts Conquests
		 * ---
		 */
		$sqlBeltsConquests = "SELECT users_belts_conquests.id_belts, users_belts_conquests.date FROM users_belts_conquests WHERE users_belts_conquests.id_users = ?";
		$dataSqlBeltsConquests = array($id);
		$beltsConquests = $this->BeltsDAO->convertToArrayBEAN($this->db->query($sqlBeltsConquests, $dataSqlBeltsConquests)->result());

		$user["belts_conquests"] = array();

		foreach ($beltsConquests as $beltConquest)
		{
			$dataBeltConquest = array();

			$dataBeltConquest["id_belts"] = $beltConquest->getAttr("idBelts");
			$dataBeltConquest["date"] = $beltConquest->getAttr("date");

			array_push($user["belts_conquests"], $dataBeltConquest);
		}


		/**
		 * ---
		 * Next Belt
		 * ---
		 */
		$sqlNextBelt = "SELECT users.*, belts.id AS next_belt, (belts.victories_required - users.total_victories) AS pending_victories FROM (SELECT users.id_belts AS current_belt, COALESCE(SUM(general_monthly_ranking.victories), 0) AS total_victories FROM users LEFT JOIN general_monthly_ranking ON general_monthly_ranking.id_users = users.id WHERE users.id = ?) AS users LEFT JOIN belts ON belts.id > users.current_belt LIMIT 1";
		$dataSqlNextBelt = array($id);
		$nextBelt = $this->UsersDAO->convertToBEAN($this->db->query($sqlNextBelt, $dataSqlNextBelt)->row());

		$user["next_belt"] = $nextBelt->getAttr("nextBelt");
		$user["pending_victories_next_belt"] = $nextBelt->getAttr("pendingVictories");

		echo json_encode($user);
	}

	/**
	* get list of facebook friends
	*/
	public function friends()
	{
		$fql = "SELECT uid, name, pic_square FROM user WHERE is_app_user AND uid IN (SELECT uid2 FROM friend WHERE uid1 = me())";

		$params = array(
			"method"=>"fql.query",
			"query"=>$fql
			);

		$result = $this->facebook->api($params);

		$data = $result->data;

		$users = array();

		if ($data)
		{
			$uids = array();

			foreach ($data as $fbUser)
			{
				$uids[] = $fbUser->uid;
			}

			$result = $this->db->query("SELECT users.id FROM users WHERE fb_id IN (".implode(",", $uids).")")->result();

			foreach ($result as $user)
			{
				$users[] = $user->id;
			}
		}

		echo json_encode($users);
	}

	/**
	* set invitation type
	* @param $idInvitationsType
	*/
	public function setInvitationType()
	{
		$invitationsType = intval($this->input->post("id_invitations_types"));
		$id = $this->session->userdata("id");

		$this->db->query("UPDATE users SET id_invitations_types = ? WHERE id = ?", array($invitationsType, $id));

		$data = array();
		$data["success"] = TRUE;

		if ($this->db->_error_message())
		{
			$data["success"] = FALSE;
		}

		echo json_encode($data);
	}

	/**
	* Send facebook notifications
	* @param $message
	* @param $params
	* @param $id_user_facebook
	* @return boolean
	*/
	public function notify()
	{
		$message = $this->input->post("message");
		$params = $this->input->post("params");
		$idUserFacebook = $this->input->post("id_user_facebook");

		// verify if user can receive facebook notifications
		$row = $this->db->query("SELECT allow_news_on_fb FROM users WHERE fb_id = ?", array($idUserFacebook))->row();
		$user = $this->UserDAO->convertToBEAN($row);

		if ($user->getAttr("allowNewsOnFb"))
		{
			$data = array("template" => $message, "href" => $params);


			// to do
			// get 'n set access token

			$this->facebook->api("/".$idUserFacebook."/notifications", $data);

			echo TRUE;
		}
		else
		{
			echo FALSE;
		}
	}

	/**
	* Logged user allow facebook notifications
	* @param $allow
	*/
	public function allowNewsFB()
	{
		$allow = intval($this->input->post("allow"));
		$idUser = $this->session->userdata("id");

		$this->db->query("UPDATE users SET allow_news_on_fb = ? WHERE id = ?", array($allow, $idUser));

		$data = array();
		$data["success"] = TRUE;

		if ($this->db->_error_message())
		{
			$data["success"] = FALSE;
		}

		echo json_encode($data);
	}

	/**
	 * get avatar user
	 * @param string $id
	 * @return image
	 */
	public function avatar()
	{
		$id = $this->input->get("id");

		$row = $this->db->query("SELECT id, fb_id, avatar_url FROM users WHERE id = ?", array($id))->row();

		$avatar = AVATAR_DEFAULT;

		if ($row)
		{
			$avatar = ($row->fb_id ? "http://graph.facebook.com/".$row->fb_id."/picture?width=100&height=100" : (is_null($row->avatar_url) ? base_url() . AVATAR_DEFAULT : base_url() . $row->avatar_url));
		}

		header('Location: ' . $avatar);
	}


	/**
	 * Insert user on database
	 * @param $name
	 * @param $email
	 * @param $password
	 */
	public function signup()
	{
		$name = $this->input->post("name");
		$email = $this->input->post("email");
		$password = $this->input->post("password");
		$confirmation_token = md5(uniqid(rand(), true));

		$pass_len = strlen(trim($password));
		$name_len = strlen($name);

		$data = array();
		$data['error_code'] = ($name_len < 2) ? 1 : 0;
		$data['error_code'] = ($pass_len < 2) ? 2 : $data['error_code'];
		$data['error_code'] = !valid_email($email) ? 3 : $data['error_code'];
		$data["success"] = FALSE;

		$password = md5($password);

		if($data['error_code']>0) {
			echo json_encode($data);
			exit();
		}

		$row = $this->db->query("SELECT fb_email FROM users WHERE fb_email = ?", array($email))->row();

		if(!$row)
		{
			$this->db->query("INSERT INTO users (fb_name, fb_email, password, fb_id, confirmation_token, id_localization_locales) VALUES (?,?,?, NULL, ?,?)",array($name, $email, $password, $confirmation_token, LOCALE_PT));

			$this->callAPI("POST", base_url()."api/mails/send", array("receiver"=>$email,
																	  "password"=>$this->input->post("password"),
																	  "id"=>$this->db->insert_id(),
																	  "name"=>$name,
																	  "token"=>$confirmation_token,
																	  "message"=>1));

			$data["success"] = TRUE;
		}
		else {
			$data['error_code'] = 4;
		}

		echo json_encode($data);
	}

	/**
	 * Recover user password
	 * @param $email
	 */
	public function recoverpass()
	{
		$email = $this->input->post("email");

		$data = array();
		$data['error_code'] = !valid_email($email) ? 3 : 0;
		$data["success"] = FALSE;

		if($data['error_code']>0) {
			echo json_encode($data);
			exit();
		}

		$row = $this->db->query("SELECT id, fb_email, email_confirmed, confirmation_token FROM users WHERE fb_email = ?", array($email))->row();

		if($row)
		{
			if($row->email_confirmed && $row->confirmation_token) {
				$this->callAPI("POST", base_url()."api/mails/send", array("receiver"=>$row->fb_email,
																	  "password"=>"****",
																	  "id"=>$row->id,
																	  "token"=>$row->confirmation_token,
																	  "message"=>2));
				$data["success"] = TRUE;
			}

			if(!$row->email_confirmed) {
				$data["success"] = FALSE;
				$data['error_code'] = 10;
				$data['id'] = $row->id;
				$data['token'] = $row->confirmation_token;
			}

			if(!$row->confirmation_token) {
				$confirmation_token = md5(uniqid(rand(), true));
				$this->db->query("UPDATE users SET confirmation_token = ? WHERE id = ?", array($confirmation_token, $row->id));

				$this->callAPI("POST", base_url()."api/mails/send", array("receiver"=>$row->fb_email,
																	  "password"=>"****",
																	  "id"=>$row->id,
																	  "token"=>$confirmation_token,
																	  "message"=>2));
				$data["success"] = TRUE;
			}
		}
		else {
			$data['error_code'] = 5;
		}

		echo json_encode($data);
	}


	/**
	 * Recover user password
	 * @param $password
	 * @param $password_confirmation
	 * @param $user_id
	 * @param $confirmation_token
	 */
	public function changepass()
	{

		$password = md5($this->input->post("password"));
		$password_confirmation = md5($this->input->post("password_confirmation"));
		$id = $this->input->post("user_id");
		$confirmation_token = $this->input->post("confirmation_token");

		$pass_len = strlen(trim($this->input->post("password")));
		$passc_len = strlen(trim($this->input->post("password_confirmation")));

		$data = array();
		$data['error_code'] = ($pass_len < 2) ? 2 : 0;
		$data['error_code'] = ($passc_len < 2) ? 6 : $data['error_code'];
		$data['error_code'] = ($this->input->post("password") !== $this->input->post("password_confirmation")) ? 7 : $data['error_code'];

		$data["success"] = FALSE;

		if($data['error_code']>0) {
			echo json_encode($data);
			exit();
		}

		$row = $this->db->query("SELECT id, confirmation_token FROM users WHERE id = ?", array($id))->row();

		if($row)
		{
			if($confirmation_token == $row->confirmation_token) {
				$this->UsersDAO->reset();
	            $this->UsersDAO->where = array("id"=>$row->id);
	            $this->UsersDAO->info = array("confirmation_token"=>NULL,"password"=>$password);
	            $this->UsersDAO->update();
				$data["success"] = TRUE;
			}
			else {
				$data['error_code'] = 8;
			}
		}
		else {
			// usuário não existe
			$data['error_code'] = 9;
		}

		echo json_encode($data);
	}


	/**
	 * get ranking position of specified game type
	 * @param int $id user id
	 * @param int $game_type
	 * @return array
	 */
	public function ranking()
	{
		$id = $this->input->post("id");
		$idGameType = $this->input->post("id_game_type");

		echo json_encode($this->getRankingPosition($id, $idGameType));
	}


	 /**
     * @param int $id
     * @param int $confirmation_token
     * @return string
     */
    public function activate()
    {
        $id = $this->input->post("id");
        $confirmation_token = $this->input->post("confirmation_token");

        $this->UsersDAO->reset();
        $this->UsersDAO->where = array("id"=>$id, "confirmation_token"=>$confirmation_token);
        $this->UsersDAO->oneElement = true;
        $user = $this->UsersDAO->search();

        $data = array();
        $data["success"] = FALSE;

        if ($user)
        {
            if(ord($user->getAttr("email_confirmed"))==0) {
                $this->UsersDAO->reset();
                $this->UsersDAO->where = array("id"=>$user->getAttr("id"));
                $this->UsersDAO->info = array("confirmation_token"=>NULL,"email_confirmed"=>TRUE);
                $this->UsersDAO->update();
                $data["success"] = TRUE;
            }
            else {
            	// cadastro já confirmado
                $data["error_code"] = 1;
            }
        }

        echo json_encode($data);
    }

     /**
     * @param int $id
     * @return string
     */
    public function resendactivation() {
    	$id = $this->input->post("id");
		$user = $this->db->query("SELECT id, fb_email, confirmation_token FROM users WHERE id = ?", array($id))->row();

        $data = array();
        $data["success"] = FALSE;

        if($user) {
	    	$this->callAPI("POST", base_url()."api/mails/send", array("receiver"=>$user->fb_email,
																	  "password"=>"****",
																	  "id"=>$user->id,
																	  "token"=>$user->confirmation_token,
																	  "message"=>1));
	    	$data["success"] = TRUE;
	    }

	    echo json_encode($data);
    }

	public function updateName()
    {
		$id = $this->session->userdata("id");
		$name = $this->input->post("name");

		$data = array();
		$data["success"] = FALSE;

		if(!empty($id) && !empty($name))
		{
			$name = trim($name);
			$this->UsersDAO->reset();
			$this->UsersDAO->where = array("id"=>$id);
			$this->UsersDAO->info = array("fb_name"=>$name);
			$this->UsersDAO->update();

			$data["success"] = TRUE;
		}

		echo json_encode($data);
    }

	public function updateAvatar()
    {
		$id = $this->session->userdata("id");
		$img = $this->input->post("img");

		$data = array();
		$data["success"] = FALSE;

		if(!empty($id) && !empty($img))
		{
			$im = imagecreatefromstring(base64_decode($img));

			$path = AVATAR_USERS_PATH . "/" . $id . ".png";

			imagepng($im,$path);

			imagedestroy($im);

			$this->UsersDAO->reset();
			$this->UsersDAO->where = array("id"=>$id);
			$this->UsersDAO->info = array("avatar_url"=>$path);
			$this->UsersDAO->update();

			$data["success"] = TRUE;
		}

		echo json_encode($data);
    }
}

?>