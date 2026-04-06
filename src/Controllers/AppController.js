exports.index = async (req, res) => {
    try {
        res.render('index', { requests });
    } catch (e) {
        logs.error(e.message);
        return res.status(200).send({'success' : false, 'msg' : e.message});
    }
};

exports.webhook = async (req, res) => {
    try {
        // Armazena as informações da requisição
        const requestDetails = {
            method: req.method,
            headers: req.headers,
            body: req.body,
            query: req.query,
            params: req.params,
            path: req.path,
            timestamp: new Date().toISOString()
        };

        // Limita a 500 requests, removendo o mais antigo se necessário
        if (requests.length >= 500) {
            requests.shift(); // Remove o primeiro
        }

        requests.push(requestDetails);

        // Salva no arquivo
        saveRequests();

        // Emite um evento para todos os clientes conectados via WebSocket
        io.emit('newRequest', requestDetails);

        res.status(200).send({success: true, msg: 'Webhook recebido'});
    } catch (e) {
        logs.error(e.message);
        return res.status(200).send({'success' : false, 'msg' : e.message});
    }
};

exports.clear = async (req, res) => {
    try {
        requests = [];

        // Salva no arquivo
        saveRequests();

        // Notifica os clientes conectados via WebSocket para limpar a tabela
        io.emit('clearRequests');
        res.status(200).send({success: true, msg: 'Requisições limpas'});
    } catch (e) {
        logs.error(e.message);
        return res.status(200).send({'success' : false, 'msg' : e.message});
    }
};

exports.replay = async (req, res) => {
    try {
        const index = parseInt(req.params.index);
        if (isNaN(index) || index < 0 || index >= requests.length) {
            return res.status(400).send({success: false, msg: 'Índice inválido'});
        }

        const requestToReplay = requests[index];
        const axios = require('axios');

        // Reconstroi a URL
        const url = `${req.protocol}://${req.get('host')}${requestToReplay.path}`;
        const config = {
            method: requestToReplay.method,
            url: url,
            headers: requestToReplay.headers,
            data: requestToReplay.body,
            params: requestToReplay.query
        };

        // Remove headers que podem causar problemas
        delete config.headers.host;
        delete config.headers['content-length'];

        const response = await axios(config);
        res.status(200).send({success: true, msg: 'Replay executado', response: {status: response.status, data: response.data}});
    } catch (e) {
        logs.error('Erro no replay:', e.message);
        return res.status(500).send({'success' : false, 'msg' : e.message});
    }
};
