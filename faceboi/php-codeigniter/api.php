<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

require_once('libs/facebook/facebook.php');
require_once('libs/phpmailer/PHPMailerAutoload.php');

class Api extends CI_Controller
{
	private $facebook;

	public function __construct()
	{
		parent::__construct();

		$this->checkLogin();
	}

	private function checkLogin()
	{
		$accessToken = $this->input->post('access_token');

		$config = array(
		      'appId' => APP_ID,
		      'secret' => APP_SECRET,
		      'fileUpload' => false,
		      'allowSignedRequest' => false,
		 );

		$this->facebook = new Facebook($config);

		$this->facebook->setAccessToken($accessToken);

	 	$userId = $this->facebook->getUser();

		if (!$userId)
		{
			$data = array();
			$data['success'] = false;
			$data['msg_error'] = 'need_login';

			echo json_encode($data);

			die;
		}
	}

	public function alert()
	{
		$tags = $this->input->post('tags');
		$idFrom = $this->input->post('id_from');
		$idTo = $this->input->post('id_to');
		$created = date('Y-m-d H:i:s');

		$this->db->query('INSERT INTO alerts (id_from, id_to, created) VALUES (?, ?, ?)', array($idFrom, $idTo, $created));

		$idAlert = $this->db->insert_id();

		$tags = explode(",", $tags);

		foreach ($tags as $tag)
		{
			if ($tag != '')
			{
				$this->db->query('INSERT INTO alerts_has_hashtags (id_alerts, hashtag) VALUES (?, ?)', array($idAlert, $tag));
			}
		}

		$data = array();
		$data['success'] = FALSE;

		if (!$this->db->_error_message())
		{
			$data['success'] = TRUE;
		}

		echo json_encode($data);

		$this->sendNotification($idTo);
	}

	public function alerts()
	{
		$idTo = $this->input->post('id_to');

		$result = $this->db->query('SELECT alerts.created, GROUP_CONCAT(alerts_has_hashtags.hashtag) AS tags FROM alerts LEFT JOIN alerts_has_hashtags ON alerts_has_hashtags.id_alerts = alerts.id WHERE id_to = ? GROUP BY alerts.created DESC', array($idTo))->result();

		$data = array();
		$data['success'] = FALSE;
		$data['alerts'] = array();

		if (!$this->db->_error_message())
		{
			$data['success'] = TRUE;

			foreach ($result as $row)
			{
				$alert = array('created' => $row->created, 'tags' => $row->tags);

				$data['alerts'][] = $alert;
			}
		}

		echo json_encode($data);
	}

	public function signup()
	{
		$idFacebook = $this->input->post('id_facebook');
		$email = $this->input->post('email');
		$name = $this->input->post('name');
		$username = $this->input->post('username');
		$created = date('Y-m-d H:i:s');

		$this->db->query('INSERT INTO users (id_facebook, name, email, username, created) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), username = VALUES(username)', array($idFacebook, $name, $email, $username, $created));

		$data = array();
		$data['success'] = FALSE;

		if (!$this->db->_error_message())
		{
			$data['success'] = TRUE;
		}

		echo json_encode($data);
	}

	public function banner()
	{
		$page = $this->input->post('page');

		$acceptedPages = array('home', 'alerts', 'alerted', 'help');

		$data = array();

		//$data['success'] = in_array($page, $acceptedPages);
		$data['success'] = FALSE;

		echo json_encode($data);
	}

	public function registerDevice()
	{
		$idFacebook = $this->input->post('id_facebook');
		$userId = $this->input->post('user_id');

		$this->db->query('UPDATE users SET user_id = ? WHERE id_facebook = ?', array($userId, $idFacebook));

		$data = array();

		$data['success'] = FALSE;

		if (!$this->db->_error_message())
		{
			$data['success'] = TRUE;
		}

		echo json_encode($data);
	}

	public function hashtags()
	{
		$hashtags = array(
			'olhonopersonal' => 'Cuidado, ela não sai da academia e dizem que o professor é especialmente atencioso com ela.',
			'vcsaieleentra' => 'Ouvi falar que toda vez que você sai de casa, ela chama o bombeiro, eletricista, encanador...',
			'amigogay' => 'Huumm... Desconfie do "amigo gay" que não conhece uma música da Madonna, toma cerveja no gargalo e sabe a escalação do Mengão de 81...',
			'dordecabeçatododia' => 'Também pudera, ela passa o dia todo na "atividade"... com o OUTRO!',
			'melhoramigo' => 'E você pensando que o melhor amigo dela fosse o Rex ou seu cartão de crédito! "Camarão que dorme a onda leva..."',
			'furaolho' => 'Tarde demais... pegaram sua mulher! Aquele cara que se dizia seu amigo foi lá e POW - deu uma bicuda, duas voadoras e cinco cruzados no meio da sua retina! "Melhor ser cego do que não enxergar..."',
			'semsinal' => '"Perdidão" clássico detectado! De que adianta ter um novíssimo smartphone, o plano com mil torpedos, Internet ilimitada, a maior área de cobertura e sempre que você liga, o maldito telefone tá sempre sem sinal??! Hora de rever sua lista de contatos...',
			'colavelcro' => 'Você foi trocado por OUTRA. Mas nem tudo está perdido, tente reverter fazendo um convite para uma brincadeirinha a três. Vai que cola...',
			'notrabalho' => 'Ela ganhou duas promoções em menos de um ano, vai viajar pra um resort no Nordeste em treinamento e sempre atende baixinho os telefonemas emergenciais de trabalho - no meio da madrugada?! É amigo, ô mulher "competente"!',
			'passeionoshopping' => 'Perfeito... pra ELA!! Num só lugar ela pode fazer o cabelo, a unha, comprar uma lingerie e ainda encontrar o maldito no escurinho do cinema!',
			'choppcomasamigas' => 'Cerva gelada, amiguinhos da sala ao lado, sorrisinhos, troca de telefones e no final... créu - sabemos quem era o aperitivo. Como dizia o Anivaldo: "Choppinho na mão, calçinha no chão!"',
			'borrachafraca' => 'Ele já não é mais o mesmo. Pela sua performance sexual ele já foi conhecido como Conan - o Bárbaro, mas hoje em dia atende por Lula Molusco. Mesmo com o aditivo das "balinhas azuis" sua transa mais longa é o tempo de preparo de um macarrão instantâneo...',
			'cartaovermelho' => 'Esquece o futebol, amigo! Enquanto você pensa que é o Messi, tem atacante, zagueiro e gandula balançando o capim no fundo do gol - dela!',
			'tirotrocado' => 'Ela jurou que perdoaria sua traição... mas se a mulher enganou até o Capeta, é claro que revidaria! E fez, com aquele cara que você tanto odiava... Doloroso, mas previsível! Maldito Gérson!!!'
			);

		$data = array();

		$data['success'] = TRUE;
		$data['hashtags'] = $hashtags;

		echo json_encode($data);
	}

	private function sendNotification($idFacebook)
	{
		$user = $this->db->query('SELECT * FROM users WHERE id_facebook = ? AND user_id != ""', array($idFacebook))->row();

		if ($user)
		{
			// user exists in database, send push notification
			$this->sendPushNotification($user->user_id);
		}
		else
		{
			// user not exists in database, send email
			// pelo id, pegar username
			$this->sendEmailNotification($idFacebook);
		}
	}

	private function sendPushNotification($userId)
	{
		$key        = "9ewKJpjrNjdZHZkB4QLZrbVkQAwNYtjG";
	    $username   = "rafaelcosta";
	    $password   = "1123581321";
	    $channel    = "alerts";
	    $message    = "Marcaram você no FaceBoi. É melhor começar a rezar...";
	    $title      = "Deu ruim!";
	    $tmp_fname  = 'cookie.txt';
	    $json       = '{"alert":"'. $message .'","title":"'. $title .'","vibrate":true,"sound":"default","badge":1}';

        /*** INIT CURL *******************************************/
        $curlObj    = curl_init();
        $c_opt      = array(CURLOPT_URL => 'https://api.cloud.appcelerator.com/v1/users/login.json?key='.$key,
                            CURLOPT_COOKIEJAR => $tmp_fname, 
                            CURLOPT_COOKIEFILE => $tmp_fname, 
                            CURLOPT_RETURNTRANSFER => true, 
                            CURLOPT_POST => 1,
                            CURLOPT_POSTFIELDS  =>  "login=".$username."&password=".$password,
                            CURLOPT_FOLLOWLOCATION  =>  1,
                            CURLOPT_TIMEOUT => 60);
     
        /*** LOGIN **********************************************/
        curl_setopt_array($curlObj, $c_opt); 
        $session = curl_exec($curlObj);     
     
        /*** SEND PUSH ******************************************/
        $c_opt[CURLOPT_URL]         = "https://api.cloud.appcelerator.com/v1/push_notification/notify.json?key=".$key; 
        $c_opt[CURLOPT_POSTFIELDS]  = "to_ids=".$userId."&channel=".$channel."&payload=".$json; 
     
        curl_setopt_array($curlObj, $c_opt); 
        $session = curl_exec($curlObj);     
     
        /*** THE END ********************************************/
        curl_close($curlObj);
	}

	private function sendEmailNotification($idFacebook)
	{
		$result = $this->facebook->api('/'.$idFacebook.'?fields=username', 'GET');

		$username = $result['username'];

		if ($username)
		{
			$email = $username . '@facebook.com';

			$mail = new PHPMailer();
			$mail->isSMTP();
			$mail->Host = "email-smtp.eu-west-1.amazonaws.com";
			$mail->Port = 25;
			$mail->SMTPAuth = true;
			$mail->SMTPSecure = 'tls';
			$mail->Username = "AKIAJ5ESEFDB6FLPIRVQ";
			$mail->Password = "AoMLZLHSmoaxM/7Rj8TaqlFc/hVYJvh6596WEkNasTnJ";
			$mail->setFrom('contato@faceboi.eu');
			$mail->addAddress($email);
			$mail->Subject = 'Deu ruim!';
			$mail->msgHTML('Marcaram você no FaceBoi. É melhor começar a rezar... Baixe o aplicativo e saiba o que ELA anda fazendo... http://www.faceboi.eu/');

			$mail->send();
		}
		else
		{
			echo 'not found username: ' . $username;
		}
	}

	public function teste()
	{
		$this->sendEmailNotification('647144403');
	}
}