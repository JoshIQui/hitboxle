const http = require('http');
const url = require('url');
const query = require('querystring');
const htmlHandler = require('./htmlResponses.js');
const jsonHandler = require('./jsonResponses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const urlStruct = {
  GET: {
    '/': htmlHandler.getIndex,
    '/style.css': htmlHandler.getCSS,
    '/getPuzzle': jsonHandler.getPuzzle,
    '/changePuzzle': jsonHandler.getNewPuzzle,
    notFound: jsonHandler.notFound,
  },
  HEAD: {
    '/getPuzzle': jsonHandler.getPuzzleMeta,
    notFound: jsonHandler.notFoundMeta,
  },
  POST: {
    '/checkAnswer': jsonHandler.checkAnswer,
  },
};

// **NOTE**: This is a helper function taken from class DEMOs.
// It will be properly credited on the final submission.

// Recompiles the body of a request, and then calls the
// appropriate handler once completed. Some request methods
// (like POST) send their request body in pieces or chunks. This
// is in contrast to something like a GET request, where the entire
// request always comes in as one packet. In order to use a POST
// request, we need to have the entire request body before proceeding.
// This function will reassemble the body and then handle the request.
// The "handler" parameter is the request handler function to call after
// we have the request completely reassembled.
const parseBody = (request, response, handler) => {
  // The request will come in in pieces. We will store those pieces in this
  // body array.
  const body = [];

  // The body reassembly process is event driven, much like when we are streaming
  // media like videos, etc. We will set up a few event handlers. This first one
  // is for if there is an error. If there is, write it to the console and send
  // back a 400-Bad Request error to the client.
  request.on('error', (err) => {
    console.dir(err);
    response.statusCode = 400;
    response.end();
  });

  // The second possible event is the "data" event. This gets fired when we
  // get a piece (or "chunk") of the body. Each time we do, we will put it in
  // the array. We will always recieve these chunks in the correct order.
  request.on('data', (chunk) => {
    body.push(chunk);
  });

  // The final event is when the request is finished sending and we have recieved
  // all of the information. When the request "ends", we can proceed. Turn the body
  // array into a single entity using Buffer.concat, then turn that into a string.
  // With that string, we can use the querystring library to turn it into an object
  // stored in bodyParams. We can do this because we know that the client sends
  // us data in X-WWW-FORM-URLENCODED format. If it was in JSON we could use JSON.parse.
  request.on('end', () => {
    const bodyString = Buffer.concat(body).toString();
    const bodyParams = query.parse(bodyString);

    // Once we have the bodyParams object, we will call the handler function. We then
    // proceed much like we would with a GET request.
    handler(request, response, bodyParams);
  });
};

const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url);

  // If the request method is not found, call the notfound function from the url struct
  if (!urlStruct[request.method]) {
    return urlStruct.GET.notFound(request, response);
  }

  // Call the function corresponding to the method and path from the url struct
  switch (request.method) {
    case 'GET':
      if (urlStruct[request.method][parsedUrl.pathname]) {
        return urlStruct[request.method][parsedUrl.pathname](request, response);
      }
      return jsonHandler.notFound(request, response);

    case 'HEAD':
      if (urlStruct[request.method][parsedUrl.pathname]) {
        return urlStruct[request.method][parsedUrl.pathname](request, response);
      }
      return jsonHandler.notFoundMeta(request, response);

    case 'POST':
      return parseBody(request, response, urlStruct[request.method][parsedUrl.pathname]);

    default:
      return urlStruct.GET.notFound(request, response);
  }
};

// Sets the puzzle to a new puzzle from the puzzles.json file
const setNewPuzzle = () => {
  jsonHandler.setupPuzzle();

  // Calls this function to set a new puzzle again in 1 hour
  setInterval(setNewPuzzle, 3600000);
};

// start server
http.createServer(onRequest).listen(port, () => {
  setNewPuzzle();

  console.log(`Listening on 127.0.0.1: ${port}`);
});
