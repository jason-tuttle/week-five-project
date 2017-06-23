const express = require('express');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const mustacheExpress = require('mustache-express');
const path = require('path');
const session = require('express-session');
const fs = require('fs');

const app = express();

// mustache setup
app.engine('mustache', mustacheExpress());
app.set('views', './views');
app.set('view engine', 'mustache');

// use validator to check form submissions
app.use(expressValidator());

app.use(session({
  secret: 'zaphod beeblebrox',
  resave: false,
  saveUninitialized: true
}));

//serve static files from a dir called 'resources' pointing to 'public'
app.use('/resources', express.static(path.join(__dirname, './public')));
app.use('/', express.static(path.join(__dirname, './')));
app.use(bodyParser.urlencoded({extended: true}));

//fetch the word dictionary, grab a random word and store it in the session
app.use('/game', function(req, res, next) {
  var game = req.session.game;
  if (!game) {
    game = req.session.game = {};
    const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");
    game.word = words[(Math.floor(Math.random() * words.length))];
    game.guessWord = Array.from(game.word).fill("_");
    game.guessed = [];
    game.guessesLeft = 8;
    console.log(Object.values(req.session.game));
  }
  next();
});

app.get('/game', function(req, res) {
  res.render('game', { game: req.session.game });
});

app.post('/game', function(req, res) {
  req.checkBody('guess', 'enter one letter, please')
    .notEmpty()
    .isLength(1)
    .isAlpha();
    

});

app.listen(3030, () => console.log("Roll tape, quiet in the house..."));
