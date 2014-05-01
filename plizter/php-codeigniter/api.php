<?php

require("abstractcontroller.php");

/**
 * JSON API - Todos os requests devem ser feitos por POST e será retornado um json object.
 */

class Api extends AbstractController
{
    public function __construct()
    {
        parent::AbstractController();
    }

    /**
     * Login
     * @param string $email
     * @param string $password 
     * @return boolean|array
     */
    public function login()
    {
        $email = $_POST["email"];
        $password = $_POST["password"];

        $data = parent::login($email, $password, false, false);

        if (!empty($data))
        {
            echo json_encode($data);
        }
        else
        {
            echo FALSE;
        }
    }

    /**
     * Desconectar usuário
     * @return boolean
     */
    public function logout()
    {
        parent::logout();

        echo TRUE;
    }

    /**
     * Criar usuário
     * @param string $name
     * @param string $email
     * @param string $password
     * @param int $id_city
     * @param string $date_of_birth
     * @param int $id_gender
     * @param boolean $login Boolean para logar automaticamente após o cadastro
     * @return boolean|array
     */
    public function createUser()
    {

    }

    /**
     * Enviar email para recuperação de senha
     * @param string $email
     * @return boolean
     */
    public function rememberPassword()
    {
        echo parent::rememberPassword();
    }

    /**
     * Pliztar produto
     * @param string $url
     * @param string $title
     * @param string $image
     * @param string $price
     * @param string $currency BRL | EUR
     * @param string $fullPrice optional
     * @param string $category optional
     * @param string $store optional
     * @param string $tags optional
     * @return boolean
     */
    public function plizt()
    {
        foreach ($_POST as $key=>$value)
        {
            $$key = $value;
        }

        $idCreator = $this->session->userdata("idObjects");

        return parent::plizt($url, $idCreator, $title, $image, $price, $currency, $fullPrice, $category, $store, $tags, true);
    }

    /**
    * Adicionar comentário a um plizt
    * @param int $idReceiver [objeto a receber o comentário]
    * @param string $message
    */

    public function comment()
    {
        $idSender = $this->session->userdata("idObjects");
        $idReceiver = $this->input->post("idReceiver", TRUE);
        $message = $this->input->post("message", TRUE);
        $idObjects = $this->createObject(KIND_OF_OBJECTS_COMMENTS);

        $this->db->query("INSERT INTO comments (id_sender, id_receiver, message, id_objects) VALUES (?, ?, ?, ?)", array($idSender, $idReceiver, $message, $idObjects));

        if ($this->db->_error_message())
        {
            echo FALSE;
        }
        else
        {
            echo TRUE;
        }
    }

    /**
     * Solicitar o robô do site atual. Caso não tenha robô para a URL requisitada, retorna FALSE
     * @param string $url URL da página do plizt
     * @return boolean|array
     */

    public function getRobot()
    {
        $url = $_POST["url"];
    }
}

?>
