let express = require('express');
let multer = require('multer');
let uploader = multer();

let app = express();

app.use(express.static('public'));

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.post('/file', uploader.single('upload'), (request, response) => {
  response.send('file size: ' + request.file.size);
});

app.listen(process.env.PORT || 8888);