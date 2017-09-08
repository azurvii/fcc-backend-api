let mongodb = require('mongodb');
let http = require('http');
let url = require('url');
let crypto = require('crypto');

const URL_COLLECTION_NAME = 'urls';
const MONGODB_URL = 'mongodb://abc:abc@ds129024.mlab.com:29024/fcc-url-shorts';

let result;

function getMongoDb() {
  return mongodb.connect(MONGODB_URL);
}

function getMd5Digester() {
  return crypto.createHash('md5');
}

function insertShortUrl(shortUrlObject) {
  getMongoDb().then(db => {
    let collection = db.collection(URL_COLLECTION_NAME);
    collection.insertOne(shortUrlObject)
        .then(() => console.log('New object inserted!'))
        .catch(error => console.log(`Error: ${error}.`))
        .then(() => db.close());
  });
}

function getUrlFromShort(short) {
  return getMongoDb().then(db => {
    let query = {'_id': short};
    let collection = db.collection(URL_COLLECTION_NAME);
    result = null;
    return collection.find(query)
        .toArray()
        .then(results => {
          if (results.length > 0) {
            result = results[0];
            // } else {
            //   result = 'nothing found';
          }
        })
        .catch(error => console.log(`Error: ${error}.`))
        .then(() => db.close());
  });
}

let server = http.createServer((request, response) => {
  let longForm = request.url.slice(1);
  let parsed = url.parse(longForm);
  if (parsed.hostname) {  // A valid URL.
    let hash = getMd5Digester().update(parsed.href).digest('hex').slice(0, 6);
    let record = {url: parsed.href, _id: hash};
    response.write(JSON.stringify(record) + '\n');
    insertShortUrl(record);
    response.end();
  } else {  // Not a valid URL. Maybe a request to redirect.
    getUrlFromShort(longForm)
        .then(() => {
          if (result) {
            console.log(`redirecting to ${result.url}\n`);
            response.writeHead(301, {'Location': result.url});
            response.end();
          } else {
            console.log('nothing matched\n');
            response.end('Nothing found for the given parameter.');
          }
        })
        .catch(error => {
          console.log(`Error: ${error}.`);
          response.end(error);
        });
  }
});
server.listen(process.env.PORT || 8888);