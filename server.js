require("dotenv").config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const ip = require("ip");
const appConfig = require('./configs/AppConfig');
const {join} = require("node:path");

// Cria o servidor HTTP e o integra com o socket.io
global.app = express();
global.server = http.createServer(app);
global.io = new Server(server);

//Set tools
global.logs = require('./configs/LogsConfig');
global.tools = require('./src/Helpers/ToolsHelper');
global.WWW_ROOT = __dirname;

global.requests = []

//Set extra configs
appConfig.setup();

//Set port listen
server.listen(process.env.PORT, async () => {
    logs.info(`Aplicação iniciada na porta ${process.env.PORT}`);
    logs.info(`Servidor rodando em ${process.env.NODE_ENV}`);
    logs.info(`Servidor rodando em ${ip.address()}`);
});

//Load routes
require('./src/Routes/index')();

// Tratamento para encerramento do sistema
process.on('beforeExit', code => {
    logs.info('beforeExit | Process will exit with code: %i ', code);
})

process.on('exit', code => {
    logs.info('exit | call to process exit: %i ', code);
});

process.on('SIGTERM', signal => {
    logs.info(`SIGTERM | Process ${process.pid} received a SIGTERM signal`);
    process.exit(2)
})

process.on('SIGINT', signal => {
    logs.info(`SIGINT | Process ${process.pid} has been interrupted`);
    process.exit(3)
})

process.on('uncaughtExceptionMonitor', (err, origin) => {
    logs.error('uncaughtExceptionMonitor -> err: %s', err);
    logs.error('uncaughtExceptionMonitor -> origin: %i', origin);
    process.exit(4)
});