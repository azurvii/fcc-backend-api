let express = require('express');

let app = express();

app.get('/', (request, response) => {
  let userAgent = request.header('user-agent');
  let machineInfoRegex = /\(([^\)]*)\)/;
  let match = machineInfoRegex.exec(userAgent);
  let result = {
    'ip': request.ip,
    'language': request.header('accept-language'),
    'software': match[1]
  };
  response.end(JSON.stringify(result));
});

app.listen(process.env.PORT || 8888);