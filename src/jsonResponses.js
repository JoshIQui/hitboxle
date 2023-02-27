let puzzle = {};

const setupPuzzle = (newPuzzle) => {
  puzzle = newPuzzle;
};

const users = {};

const userStatistics = {
  averageGuesses: 0,
};

const editUserStatistics = () => {
  let numberOfUsers = 0;
  let averageGuesses = 0;

  Object.keys(users).forEach((key) => {
    numberOfUsers++;
    averageGuesses += key.guesses;
  });

  userStatistics.averageGuesses = averageGuesses / numberOfUsers;
};

const postUser = (object) => {
  users[object.username] = {
    username: object.username,
    guesses: object.guesses,
    completed: object.completed,
  };

  editUserStatistics();
};

const respond = (request, response, status, object) => {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.write(JSON.stringify(object));
  response.end();
};

const respondMeta = (request, response, status) => {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end();
};

const getPuzzle = (request, response) => {
  respond(request, response, 200, puzzle);
};

const getPuzzleMeta = (request, response) => {
  respondMeta(request, response, 200);
};

const checkAnswer = (request, response, body) => {
  if (!body.answer || !body.guesses) {
    return respond(request, response, 400, { id: 'missingParams', message: 'Answer is required' });
  }

  let responseCode = 204; // Default response code of 204 (No Content)

  // If the user does not exist on the list of users, set the status code to 201
  if (!users[body.username]) {
    responseCode = 201;
  }

  let isCorrect = false;

  if (body.answer === puzzle.answer) {
    isCorrect = true;
  }

  postUser({ username: body.username, guesses: body.guesses, completed: isCorrect });

  if (responseCode === 201) {
    if (isCorrect) {
      return respond(request, response, responseCode, { message: 'Correct Answer' });
    }

    return respond(request, response, responseCode, { message: 'Incorrect Answer' });
  }

  return respondMeta(request, response, responseCode);
};

const notFound = (request, response) => {
  const object = {
    message: 'The page you are looking for was not found.',
    id: 'notFound',
  };

  respond(request, response, 404, object);
};

const notFoundMeta = (request, response) => {
  respondMeta(request, response, 404);
};

module.exports = {
  setupPuzzle,
  getPuzzle,
  getPuzzleMeta,
  checkAnswer,
  notFound,
  notFoundMeta,
};
