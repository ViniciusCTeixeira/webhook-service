const AppController = require('../Controllers/AppController');

//Set modules
module.exports = () => {
    app.get('/', AppController.index);
    app.all('/webhook', AppController.webhook);
    app.post('/clear', AppController.clear);
    app.post('/replay/:index', AppController.replay);
};