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

        requests.push(requestDetails);

        // Limita o número de requisições armazenadas para evitar estouro de memória
        if (requests.length > 100) {
            requests.shift();
        }

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

        // Notifica os clientes conectados via WebSocket para limpar a tabela
        io.emit('clearRequests');
        res.status(200).send({success: true, msg: 'Requisições limpas'});
    } catch (e) {
        logs.error(e.message);
        return res.status(200).send({'success' : false, 'msg' : e.message});
    }
};
