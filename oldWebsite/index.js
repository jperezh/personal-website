const express = require('express');
const path = require('path');

const app = express();
const port = 8080;

app.get('/', (request, response) => {
	//response.send("Hello my friend");
	response.sendFile(path.join(__dirname, '/oldWebsite/home.html'));
});
app.use(express.static(__dirname + '/oldWebsite/assets'));

/*.get('*', (request, response) => {
	response.sendFile(path.join(__dirname, '/404.html'));
})*/

app.listen(port, () => {
	console.log("App has started listening on the port: " + port);
});
