const parser = require("body-parser");
const express = require('express');
const {join} = require("node:path");

class AppConfig {

    static setup(){
        this.setBodyParser();
        this.setMaxListeners();
        this.validateEnv();
        this.setAssets()

        app.set('view engine', 'ejs');
        app.set('views', join(WWW_ROOT, 'src', 'Templates'));
    }

    static validateEnv(){
        if (!process.env.NODE_ENV) {
            process.env.NODE_ENV = 'PRODUCTION';
        }

        if (!process.env.PORT) {
            process.env.PORT = 3000;
        }
    }

    //- Aplica limites maiores de parseamentos nos request e responses
    static setBodyParser(){
        try {
            app.use(parser.json({limit : '100mb', extended : true}));
            app.use(parser.urlencoded({limit : '100mb', extended : true}));
        } catch (e) {
            logs.error(e.message);
        }
    }

    //- Aplica um limite maior nos listerners, evita problemas com muitas instâncias
    static setMaxListeners(){
        try {
            process.setMaxListeners(500);
            require('events').EventEmitter.defaultMaxListeners = 500;
        } catch (e) {
            logs.error(e.message);
        }
    }

    static setAssets(){
        // jQuery em /js/jquery
        app.use('/js/jquery', express.static(WWW_ROOT + '/node_modules/jquery/dist'));

        // Bootstrap JS em /js/bootstrap
        app.use('/js/bootstrap', express.static(WWW_ROOT + '/node_modules/bootstrap/dist/js'));

        // Bootstrap CSS em /css/bootstrap
        app.use('/css/bootstrap', express.static(WWW_ROOT + '/node_modules/bootstrap/dist/css'));
    }
}

module.exports = AppConfig;