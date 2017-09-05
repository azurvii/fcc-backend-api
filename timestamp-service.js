let express = require('express');

let app = express();

app.get('/:param', (request, response) => {
  let param = request.params.param;
  let date;
  let unixTime;
  let timeString;
  if (/^\d+$/g.test(param)) {
    unixTime = parseInt(param) * 1000;
    date = new Date(unixTime);
    timeString = date.toUTCString();
  } else {
    unixTime = Date.parse(param);
    if (isNaN(unixTime)) {
      unixTime = null;
      timeString = null;
    } else {
      timeString = new Date(unixTime).toUTCString();
    }
  }
  response.end(JSON.stringify({'unix': unixTime, 'natural': timeString}));
});

app.listen(process.env.PORT || 8888);