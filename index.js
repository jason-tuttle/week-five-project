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
  const errors = req.validationErrors();

  // lets use a shorter name for everything
  const game = req.session.game;

  if (game.guessesLeft > 1) {
    if (errors) {  // check for form errors
      res.render('game', { game: game, error: errors[0].msg })
    } else {  // check for valid but repeated guesses
      if (game.guessed.includes(req.body.guess)) {
        res.render('game', { game: game, error: "You've already guessed that letter" });
      } else {  // no errors, no repeats
        if (!game.word.includes(req.body.guess)) { // letter not in the word to guess
          game.guessesLeft--;
          game.guessed.push(req.body.guess);
          res.render('game', { game: game });
        } else { // word contains our guess
          game.word.split('').forEach(function(letter, idx) { // replace blanks with the matches
            if (letter === req.body.guess) {
              game.guessWord[idx] = req.body.guess;
            }
          });
          game.guessed.push(req.body.guess);
          if (!game.guessWord.includes("_")) {  // if there are no more blanks in the guessWord...
            res.render('game', { game: game, win: true, winLossMessage: "You win! 😁"})
          } else {  // otherwise we have more letters to guess
            res.render('game', { game: game });
          }
        }
      }
    }
  } else { // we just used our last guess
    game.guessesLeft--;
    res.render('game', { game: game, lose: true, winLossMessage: "You're out of guesses... ☹️"})
  }
});

app.listen(3030, () => console.log("Roll tape, quiet in the house..."));

/*
☹️
frowning face
Unicode: U+2639 U+FE0F, UTF-8: E2 98 B9 EF B8 8F

😁
grinning face with smiling eyes
Unicode: U+1F601, UTF-8: F0 9F 98 81
*/
