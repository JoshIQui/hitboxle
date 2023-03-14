const puzzles = require('../data/puzzles.json');

let puzzle = {};

let users = {};

let userStatistics = {
  averageGuesses: 0,
};

const setupPuzzle = () => {
  const randNum = Math.floor(Math.random() * 12) + 1;

  users = {};

  userStatistics = {
    averageGuesses: 0,
  };

  puzzle = puzzles[randNum];
};

// Currently changes only the average guesses
const editUserStatistics = () => {
  let numberOfUsers = 0;
  let totalGuesses = 0;

  Object.keys(users).forEach((key) => {
    numberOfUsers++;
    totalGuesses += parseInt(users[key].guesses, 10);
  });

  userStatistics.averageGuesses = totalGuesses / numberOfUsers;
};

// Adds a correct user to the list
const postUser = (object) => {
  users[object.username] = {
    username: object.username,
    guesses: object.guesses,
  };

  // Update user statistics
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

const getNewPuzzle = (request, response) => {
  setupPuzzle();

  respond(request, response, 200, { puzzle, averageGuesses: userStatistics.averageGuesses });
};

// Responds with the server's current puzzle object
const getPuzzle = (request, response) => {
  respond(request, response, 200, { puzzle, averageGuesses: userStatistics.averageGuesses });
};

const getPuzzleMeta = (request, response) => {
  respondMeta(request, response, 200);
};

const checkAnswer = (request, response, body) => {
  // Check if any body parameters are missing
  if (!body.answer || !body.username) {
    return respond(request, response, 400, { id: 'missingParams', message: 'Username and Answer are required' });
  }

  let responseCode = 204; // Default response code of 204 (No Content)

  // If the answer is correct,
  if (body.answer.trim().toLowerCase() === puzzle.character.trim().toLowerCase()) {
    // If the user does not exist on the list of users, set the status code to 201
    if (!users[body.username]) {
      responseCode = 201;
    }

    // Add the user to the list of users
    postUser({ username: body.username, guesses: body.guesses });

    // If a new user was added to the list,
    if (responseCode === 201) {
      // Respond with a correct
      return respond(request, response, responseCode, {
        message: 'Correct Answer. Nice job', correct: true, image: puzzle.image, guesses: body.guesses,
      });
    }

    // If the user already existed, respond with code 204
    // (the client will interpret this as a correct answer)
    return respondMeta(request, response, responseCode);
  }
  // Defaults to responding with an incorrect
  return respond(request, response, 200, { message: 'Incorrect Answer. Try again.', correct: false });
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
  getNewPuzzle,
  setupPuzzle,
  getPuzzle,
  getPuzzleMeta,
  checkAnswer,
  notFound,
  notFoundMeta,
};
