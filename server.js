const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 3000;

// Cria o servidor HTTP e o integra com o socket.io
const server = http.createServer(app);
const io = new Server(server);

// Armazena as requisições em memória
let requests = [];

// Configura o body-parser para receber JSON e dados URL-encoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configura o EJS como mecanismo de visualização
app.set('view engine', 'ejs');

// Rota principal para visualizar as requisições
app.get('/', (req, res) => {
    res.render('index', { requests });
});

// Rota para receber as requisições do webhook
app.all('/webhook', (req, res) => {
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
});

// Inicia o servidor
server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
