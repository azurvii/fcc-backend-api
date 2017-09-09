let express = require('express');
let mongodb = require('mongodb');
let httpClient = require('request-promise-native');

let app = express();

const QUERY_COLLECTION_NAME = 'queries';
const MONGODB_URL = 'mongodb://abc:abc@ds129024.mlab.com:29024/fcc-url-shorts';
const IMAGE_SEARCH_URL_BASE = 'https://api.qwant.com/api/search/images';
const ITEMS_PER_PAGE = 10;

function getMongoDb() {
  return mongodb.connect(MONGODB_URL);
}

function insertQuery(query) {
  getMongoDb().then(db => {
    let collection = db.collection(QUERY_COLLECTION_NAME);
    let queryRecord = {query: query, time: new Date().toISOString()};
    collection.insertOne(queryRecord)
        .then(() => console.log('Query saved!'))
        .catch(error => console.error(`Error saving query: ${error}.`))
        .then(() => db.close());
  });
}

function getLastQueries() {
  return getMongoDb().then(db => {
    let collection = db.collection(QUERY_COLLECTION_NAME);
    let queries = null;
    return collection.find()
        .sort({time: -1})
        .limit(10)
        .toArray()
        .then(results => queries = results)
        .catch(error => console.error(`Error: ${error}.`))
        .then(() => db.close())
        .then(() => queries);
  });
}

function debug(message) {
  console.log(message);
}

app.get('/', (request, response) => {
  response.setHeader('Content-Type', 'text/plain');
  response.send(
      'Use /search?offset=0&q=your_term to search.\n' +
      'Use /history to see the latest 10 queries.');
});

app.get('/search', (request, response) => {
  let query = request.query['q'];
  let offset = parseInt(request.query['offset']);
  if (query) {
    insertQuery(query);
    let queryString = '?locale=en_US&count=' + ITEMS_PER_PAGE;
    if (offset) {
      queryString += '&offset=' + offset;
    }
    queryString += '&q=' + query;
    debug(queryString);
    httpClient({
      'url': IMAGE_SEARCH_URL_BASE + queryString,
      'headers': {'User-Agent': request.get('User-Agent')}
    })
        .then(data => {
          let results = JSON.parse(data).data.result.items;
          response.setHeader('Content-Type', 'application/json');
          response.send(JSON.stringify(results));
        })
        .catch(error => {
          console.error('REQUEST TO API ERROR: ' + error);
          response.sendStatus(500);
        });
  } else {
    response.sendStatus(400).end();
  }
});

app.get('/history', (request, response) => {
  getLastQueries().then(queries => {
    response.end(JSON.stringify(queries));
  });
});

app.listen(process.env.PORT || 8888);