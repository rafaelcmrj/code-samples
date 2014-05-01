<?php

require("api.php");

class DPWS extends API
{
    public function __construct()
    {
        parent::AbstractController();

        $this->init();
    }

    private function init()
    {
        $this->load->model("UsersDAO");
        $this->load->model("WorldSeriesDAO");
        $this->load->model("WorldSeriesUsersDAO");
        $this->load->model("WorldSeriesPhasesDAO");
    }

    public function start($id)
    {
        $sql = "INSERT IGNORE INTO world_series_phases_users (id_users, id_world_series_phases) SELECT wsu.id_users, wsp.id FROM world_series_users AS wsu LEFT JOIN world_series_phases AS wsp ON wsp.id_world_series = wsu.id_world_series LEFT JOIN world_series_payments ON world_series_payments.id = wsu.id_world_series_payments WHERE world_series_payments.id_payment_status = 2 AND wsu.id_world_series = ? GROUP BY wsu.id_users";

        $this->db->query($sql, array($id));

        if ($this->db->_error_message())
        {
            return FALSE;
        }
        else
        {
            $this->db->query("UPDATE world_series_phases SET started_at = NOW() WHERE started_at IS NULL AND id_world_series = ? LIMIT 1", array($id));

            return TRUE;
        }
    }

    public function createNextPhase()
    {
        // get all tournaments
        $tournaments = $this->db->query("SELECT id, event_date, NOW() as cur_date FROM world_series WHERE world_series.active")->result();

        foreach ($tournaments as $tournament)
        {
            // get current phase
            $current = $this->db->query("SELECT wsp.*, COUNT(matches.id) as total_matches FROM (SELECT *, COUNT(world_series_phases_users.id_users) as total_users FROM world_series_phases LEFT JOIN world_series_phases_users ON world_series_phases_users.id_world_series_phases = world_series_phases.id WHERE started_at IS NOT NULL AND id_world_series = ? GROUP BY id ORDER BY id DESC LIMIT 1) as wsp LEFT JOIN matches ON matches.id_world_series_phases = wsp.id", array($tournament->id))->row();

            // verifica se tem fase criada (se não tiver, id = NULL)
            if ($current->id)
            {
                // mesas necessárias para dar a fase como encerrada
                if ($current->total_users > 0)
                {
                    $neededMatches = $current->total_users < $current->max_users_per_match ? 1 : floor($current->total_users / $current->max_users_per_match);

                    if ($neededMatches == $current->total_matches)
                    {
                        $updated = FALSE;

                        // verifica se o ended_at é nulo
                        $endedAt = $this->db->query("SELECT ended_at FROM world_series_phases WHERE id = ?", array($current->id))->row()->ended_at;

                        if (!$endedAt)
                        {
                            // passa a fase atual para finalizada
                            $this->db->query("UPDATE world_series_phases SET ended_at = NOW() WHERE id = ?", array($current->id));

                            $updated = TRUE;
                        }

                        //pega a próxima fase
                        $next = $this->db->query("SELECT * FROM world_series_phases WHERE id > ? AND id_world_series = ? ORDER BY id ASC LIMIT 1", array($current->id, $tournament->id))->row();

                        if ($next)
                        {
                            $limitPositionUsers = $current->limit_position_users;

                            $this->db->query("INSERT IGNORE INTO world_series_phases_users (id_users, id_world_series_phases) SELECT matches_users.id_users, ? as id_next_phase FROM matches LEFT JOIN matches_users ON matches_users.id_matches = matches.id WHERE matches.id_world_series_phases = ? AND matches_users.position < ? GROUP BY matches_users.id_users", array($next->id, $current->id, $limitPositionUsers));

                            if ($this->db->_error_message())
                            {
                                echo FALSE;
                            }
                            else
                            {
                                $this->db->query("UPDATE world_series_phases SET started_at = NOW() WHERE id > ? LIMIT 1", array($current->id));

                                echo TRUE;
                            }
                        }
                        else
                        {
                            if ($updated)
                            {
                                // acabou o torneio e alterou a última fase para now()
                                $users = json_decode(callAPI("POST", base_url()."api/dpws/ranking", array("id"=>$tournament->id)));

                                foreach ($users as $user)
                                {
                                    $id = $user["id"];
                                    $position = $user["position"];

                                    if ($position <= 3)
                                    {
                                        callAPI("POST", base_url()."api/fb/tournament", array("id_user"=>$id, "id_tournament"=>$tournament->id, "position"=>$position));
                                    }
                                }
                            }

                            $data = array();
                            $data["success"] = FALSE;
                            $data["error"] = "ended_tournament";

                            echo json_encode($data);
                        }
                    }
                    else
                    {
                        echo FALSE;
                    }
                }
            }
            else
            {
                // entrou no else porque não tem fase criada.
                // verifica se já pode startar o torneio
                if ($tournament->cur_date >= $tournament->event_date)
                {
                    echo $this->start($tournament->id);
                }
                else
                {
                    echo FALSE;
                }
            }
        }
    }

    /**
     * list all tournaments
     * @return array
     */
    public function all()
    {
		$user = $this->session->userdata("id");

		$tournaments = $this->db->query("SELECT w.*, NOW() as cur_date, (SELECT IF(EXISTS(SELECT world_series_users.id_users FROM world_series_users LEFT JOIN world_series_payments ON world_series_payments.id = world_series_users.id_world_series_payments WHERE world_series_users.id_world_series = w.id AND world_series_users.id_users = ? AND world_series_payments.id_payment_status = 2), 1, 0)) as registered FROM world_series AS w where w.active",array($user))->result();

        $data = array();

        if ($tournaments)
        {
            $data["tournaments"] = array();

            foreach ($tournaments as $dpws)
            {
                $tournament = array();

                $tournament["id"] = $dpws->id;
                $tournament["name"] = $dpws->name;
                $tournament["id_servers"] = $dpws->id_servers;
                $tournament["reg_start_date"] = $dpws->reg_start_date;
                $tournament["reg_end_date"] = $dpws->reg_end_date;
                $tournament["event_date"] = $dpws->event_date;
                $tournament["prize_value"] = $dpws->prize_value;
                $tournament["subscription_value"] = $dpws->subscription_value;
                $tournament["registered"] = intval($dpws->registered)==1;
                $tournament["description"] = $dpws->description;

                if (strtotime($dpws->reg_end_date) > strtotime($dpws->cur_date))
                {
                    // aberto para instrição
                    $tournament["status"] = 1;
                }
                else
                {
                    if (strtotime($dpws->event_date) < strtotime($dpws->cur_date))
                    {
                        $row = $this->db->query("SELECT COUNT(id) as pending_phases FROM world_series_phases WHERE id_world_series = ? AND ended_at IS NULL", array($dpws->id))->row();

                        if ($row->pending_phases > 0)
                        {
                            // em andamento
                            $tournament["status"] = 3;
                        }
                        else
                        {
                            // encerrado
                            $tournament["status"] = 4;
                        }
                    }
                    else
                    {
                        // inscrições encerradas
                        $tournament["status"] = 2;
                    }
                }

                $data["tournaments"][] = $tournament;
            }
        }

        echo json_encode($data);
    }

    /**
     * get current tournament and user status for each
     * @param int $id id do torneio
     * @return array
     */
    public function status()
    {
        $id = $this->input->post("id");
        $user = $this->session->userdata("id");

        $dpws = $this->db->query("SELECT world_series.id, world_series.name, world_series.reg_start_date, world_series.event_date, NOW() as cur_date FROM world_series WHERE world_series.id = ? AND world_series.active", array($id))->row();

        $data = array();
        $data["success"] = FALSE;

        if ($dpws)
        {
            $data["success"] = TRUE;

            $tournament = array();

            $tournament["world_series_id"] = $dpws->id;
            $tournament["world_series_name"] = $dpws->name;
            $tournament["reg_start_date"] = $dpws->reg_start_date;
            $tournament["time_to_start"] = strtotime($dpws->event_date) - strtotime($dpws->cur_date);
            $tournament["world_series_phase_name"] = null;

            // current phase
            $phase = $this->db->query("SELECT world_series_phases.name, world_series_phases.id FROM world_series_phases WHERE world_series_phases.id_world_series = ? AND world_series_phases.ended_at IS NULL ORDER BY world_series_phases.id ASC LIMIT 1", array($id))->row();
            if ($phase)
            {
                $tournament["world_series_phase_name"] = $phase->name;
            }

            // verfica se está inscrito no torneio
            $row = $this->db->query("SELECT world_series_users.id_users FROM world_series_users LEFT JOIN world_series_payments ON world_series_payments.id = world_series_users.id_world_series_payments WHERE world_series_payments.id_payment_status = 2 AND world_series_users.id_world_series = ? AND world_series_users.id_users = ?", array($dpws->id, $user))->row();

            if ($row)
            {
                // pegar fase atual e saber se o usuário está inscrito nela
                $row = $this->db->query("SELECT world_series_phases.id FROM world_series_phases LEFT JOIN world_series_phases_users ON world_series_phases_users.id_world_series_phases = world_series_phases.id WHERE started_at IS NOT NULL AND world_series_phases_users.id_users = ? ORDER BY id DESC LIMIT 1", array($user))->row();

                if ($row)
                {
                    $row = $this->db->query("SELECT id FROM matches WHERE id_world_series_phases = ?", array($row->id))->row();

                    if ($row)
                    {
                        // verifica se é o campeão (pega a última fase, vê se já teve partida e a posição do usuário na partida)
                        $row = $this->db->query("SELECT world_series_phases.id, matches.id as match_id, matches_users.id_users, matches_users.position FROM world_series_phases LEFT JOIN matches ON matches.id_world_series_phases = world_series_phases.id LEFT JOIN matches_users ON matches_users.id_matches = matches.id ORDER BY world_series_phases.id DESC, matches_users.position ASC LIMIT 1")->row();

                        if ($row->id_users == $user && $row->position == 1)
                        {
                            // ficou em primeiro lugar na partida da última rodada = campeão
                            $tournament["user_status"] = 5;
                        }
                        else if (is_null($row->id_users))
                        {
                            // já jogou mas ainda não foi pra próxima fase (não sabe o resultado)
                            $tournament["user_status"] = 3;
                        }
                        else
                        {
                            // jogou a final mas não ganhou = eliminado
                            $tournament["user_status"] = 4;
                        }
                    }
                    else
                    {
                        // jogando, match ainda não foi computada
                        $tournament["user_status"] = 2;
                    }
                }
                else
                {
                    // verifica se o torneio ainda não começou
                    if(strtotime($dpws->event_date) > strtotime($dpws->cur_date))
                    {
                        $tournament["user_status"] = 6;
                    }
                    else
                    {
                        // eliminado do torneio
                        $tournament["user_status"] = 4;
                    }
                }
            }
            else
            {
                // não está inscrito
                $tournament["user_status"] = 1;
            }

            $data["tournament"] = $tournament;
        }

        echo json_encode($data);
    }

    /**
     * generate ranking
     * @param int $id dpws id
     * @return array
     */
    public function ranking()
    {
        $id = $this->input->post("id");

        if(empty($id))
        {
            $row = $this->db->query("SELECT id FROM world_series WHERE active AND event_date <= NOW() ORDER BY event_date DESC LIMIT 1")->first_row();
            
            if($row)
            {
                $id = $row->id;
            }
        }

        $sql = "SELECT points_rounds.* FROM (SELECT points.*, rounds.id, rounds.end_date FROM (SELECT points_phases.*, users.fb_name, users.id_belts FROM (
                    SELECT matches.id as match_id, world_series_phases.id as phase_id, matches_users.position, matches_users.id_users, (world_series_phases.id+position) as points_phase
                    FROM matches
                    LEFT JOIN world_series_phases ON world_series_phases.id = matches.id_world_series_phases
                    LEFT JOIN matches_users ON matches_users.id_matches = matches.id
                    WHERE world_series_phases.id_world_series = ?
                    ORDER BY world_series_phases.id DESC
                ) as points_phases LEFT JOIN users ON users.id = points_phases.id_users GROUP BY id_users ORDER BY phase_id DESC, points_phase ASC
                ) as points LEFT JOIN rounds ON rounds.id_world_series_phases = phase_id LEFT JOIN rounds_users ON rounds_users.id_rounds = rounds.id AND rounds_users.id_users = points.id_users WHERE rounds_users.id_users IS NOT NULL ORDER BY rounds.end_date DESC)
                as points_rounds GROUP BY points_rounds.id_users ORDER BY phase_id DESC, points_phase ASC, end_date DESC";

        $result = $this->db->query($sql, array($id))->result();

        // current phase users
        $phaseUsers = $this->db->query("SELECT * FROM (SELECT world_series_phases.name, world_series_phases.id FROM world_series_phases WHERE world_series_phases.id_world_series = ? AND world_series_phases.ended_at IS NULL ORDER BY world_series_phases.id ASC LIMIT 1) as phase LEFT JOIN world_series_phases_users ON world_series_phases_users.id_world_series_phases = phase.id", array($id))->result();

        $users = array();

        $position = 1;

        foreach ($result as $row)
        {
            $user = array();

            $user["id"] = $row->id_users;
            $user["position"] = $position;
            $user["name"] = $row->fb_name;
            $user["belt"] = $row->id_belts;

            if ($phaseUsers)
            {
                foreach ($phaseUsers as $phaseUser)
                {
                    if ($phaseUser->id_users == $row->id_users)
                    {
                        $user["name"] = null;
                        $user["belt"] = null;
                    }
                }
            }

            $users[] = $user;

            $position++;
        }

        echo json_encode($users);
    }


    /**
     * Insert dpws subscription on database
     * @param $name
     * @param $telefone
     * @param $celular
     * @param $email
     * @param $idpaypal
     * @param $cpf
     */
    public function signup()
    {
        foreach ( $_POST as $key => $value )
        {
            $keyname = str_replace('-', '', $key);
            $value = trim($value);
            ${''.$keyname} = $value;
        }

        $data = array();
        $data["has_access"] = 0;
        $data["success"] = FALSE;
        $data['error_code'] = strlen($name) < 3 ? 1 : 0;

        $telefone = preg_replace('/[^0-9]/','',$telefone);
        $telefone = (string) $telefone;
        $celular = preg_replace('/[^0-9]/','',$celular);
        $celular = (string) $celular;
        $cpf = (string) $cpf;

        $data['error_code'] = strlen($telefone) > 3 && strlen($telefone) < 10 ? 2 : $data['error_code'];
        $data['error_code'] = strlen($celular) > 3 && strlen($celular) < 10 ? 3 : $data['error_code'];
        $data['error_code'] = !valid_email($email) ? 4 : $data['error_code'];
        $data['error_code'] = !$this->_isvalidcpf($cpf) ? 5 : $data['error_code'];

        $row = $this->db->query("SELECT world_series_users.id_users FROM world_series_users LEFT JOIN world_series_payments ON world_series_payments.id = world_series_users.id_world_series_payments WHERE world_series_payments.id_payment_status = 2 AND world_series_users.id_world_series = ? AND world_series_users.id_users = ?", array($this->input->post('dpws_id'), $this->session->userdata("id")))->row();

        if($row) {
            $data['error_code'] = 6;
        }

        $this->WorldSeriesDAO->reset();
        $this->WorldSeriesDAO->oneElement = TRUE;
        $this->WorldSeriesDAO->where = array("id"=>$this->input->post('dpws_id'));
        $ws = $this->WorldSeriesDAO->search();

        $data['free_dpws'] = floatval($ws->getAttr('subscription_value')) == 0 ? 1 : 0;

        if($data['error_code'] == 0 && ($ws->getAttr('access_code') != NULL || $ws->getAttr('access_code') !== '')) {
            $data['error_code'] = $accesscode !== $ws->getAttr('access_code') ? 7 : $data['error_code'];
            // $data["has_access"] = $data['error_code'] === 7 ? 0 : 1;
        }
        else {
            $data['error_code'] = strlen($accesscode) > 0 ? 7 : $data['error_code'];
        }

        if($data['error_code']>0) {
            echo json_encode($data);
            exit();
        }

        if($user_idf=='') {
            $this->db->query("INSERT INTO users_identifications (cpf, full_name) values(?,?)", array($cpf, $name));
            $user_idf = $this->db->insert_id();
        }

        if (!$this->db->_error_message())
        {
            $this->UsersDAO->reset();
            $this->UsersDAO->where = array("id"=>$this->session->userdata("id"));
            $this->UsersDAO->info = array("id_users_identifications"=>$user_idf);
            $this->UsersDAO->update();

            $invoice_token = strtoupper('dpws_' . substr(md5(uniqid(mt_rand(), true)), 0, 10));

            $this->db->query("INSERT INTO world_series_payments (id_users, id_world_series, email, tel_number, cel_number, transaction_token) values(?, ?, ?, ?, ?, ?)",
                array($this->session->userdata("id"), $dpws_id, $email, $telefone, $celular, $invoice_token));
            $wsp_id = $this->db->insert_id();

            $this->db->query("INSERT INTO world_series_users (id_users, id_world_series, id_world_series_payments) values(?,?,?)",
                array($this->session->userdata("id"), $dpws_id, $wsp_id));

            $data["success"] = TRUE;

        }

        $data['dpws_id'] = $dpws_id;
        $data['dpws_name'] = $dpws_name;
        $data['invoice'] = $invoice_token;

        $session = array();
        $session["dpws_id"] = $dpws_id;
        $session["wsp_id"] = $wsp_id;
        $session["invoice"] = $invoice_token;
        $this->session->set_userdata($session);

        // $this->callAPI("POST", base_url()."api/payments/pay", array("dpws_id"=>$id, "dpws_name"=>$dpws_name));
        echo json_encode($data);
    }

    /**
     * Check if cpf data is valid
     * @param $cpf
     */
    private function _isvalidcpf($str) {
        // Verifica se um número foi informado
        if(empty($str)) { return FALSE; }

        // Elimina possivel mascara
        $cpf = preg_replace('/[^0-9]/','',$str);
        $cpf = str_pad($cpf, 11, '0', STR_PAD_LEFT);

        // Verifica se o numero de digitos informados é igual a 11
        if(strlen($cpf) != 11) {
            return FALSE;
            // Verifica se nenhuma das sequências invalidas abaixo
            // foi digitada. Caso afirmativo, retorna falso
        }
        else if($cpf == '00000000000' ||
            $cpf == '11111111111' ||
            $cpf == '22222222222' ||
            $cpf == '33333333333' ||
            $cpf == '44444444444' ||
            $cpf == '55555555555' ||
            $cpf == '66666666666' ||
            $cpf == '77777777777' ||
            $cpf == '88888888888' ||
            $cpf == '99999999999') {
            return FALSE;
            // Calcula os digitos verificadores para verificar se o
            // CPF é válido
            } else {
                for($t = 9; $t < 11; $t++) {
                    for($d = 0, $c = 0; $c < $t; $c++) {
                        $d += $cpf{$c} * (($t + 1) - $c);
                    }
                    $d = ((10 * $d) % 11) % 10;
                    if($cpf{$c} != $d) {
                        return FALSE;
                    }
                }
                return TRUE;
            }
    }

}

?>
