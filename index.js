const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');

const app = express();
const port = 80;

app.get('/', (request, response) => {
	response.sendFile(path.join(__dirname, '/oldWebsite/home.html'));
});
app.use(favicon(path.join(__dirname, 'oldWebsite', 'favicon.ico')))
app.use(express.static(__dirname + '/oldWebsite/assets'));

app.get('*', (request, response) => {
	response.sendFile(path.join(__dirname, '/404.html'));
});

app.listen(port, () => {
	console.log("App has started listening on the port: " + port);
});
