const express = require("express");
const bodyParser = require("body-parser");
const Sequelize = require("sequelize");
const databaseUrl = "postgres://postgres:secret@localhost:5432/postgres";

// new Sequelize instance
const db = new Sequelize(databaseUrl);

//starting express app e defining port
const app = express();
const port = 4000;

// defining my model
const Movie = db.define("movie", {
  title: Sequelize.STRING,
  yearOfRelease: Sequelize.INTEGER,
  synopsis: Sequelize.STRING
});

//inserting rolls inside my model
db.sync()
  .then(() => {
    const movies = [
      {
        title: "The Devil Wears Prada",
        yearOfRelease: 2006,
        synopsis:
          "In this forever delightful dramedy, Anne Hathaway plays an aspiring writer named Andy, who scores a dream job at a Vogue-esque fashion magazine. The only catch? Her diabolical boss Miranda Priestly (Meryl Streep) is an absolute nightmare."
      },
      {
        title: "The Birdcage",
        yearOfRelease: 1966,
        synopsis:
          "In this charming comedy, Robin Williams plays a gay Miami drag club owner who, along with his life partner, pretends to be straight in order to appease his son's conservative future in-laws."
      },
      {
        title: "The Pursuit of Happyness",
        yearOfRelease: 2007,
        synopsis:
          "The film is based on the true story of a struggling salesman named Chris Gardner (Will Smith) who is desperate to find his purpose and make a necessary career change."
      }
    ];
    Promise.all(
      //to check if the movie already exists before adding without using truncate because truncate deletes all rows (inclusive new ones added with post)
      movies.map(movie =>
        Movie.findOne({ where: { title: movie.title } }).then(movieFromDb => {
          if (movieFromDb == null) {
            return Movie.create(movie);
          } else {
            return;
          }
        })
      )
    );
  })
  .catch(console.error);

//using body-parser
app.use(bodyParser.json());

const titleValidation = (req, res, next) => {
  if (req.body.title == null) {
    res.status(400).send("Your movie must have a title");
  } else {
    next();
  }
};

//create a new movie resource
app.post("/movies", titleValidation, (req, res, next) => {
  Movie.create(req.body)
    .then(movie => {
      res.status(201).json(movie);
    })
    .catch(error => next(error));
});

//read all movies and pagination
app.get("/movies", (req, res, next) => {
  const limit = Math.min(req.query.limit || 10, 50);
  const offset = req.query.offset || 0;
  Movie.findAndCountAll({
    limit,
    offset
  })
    .then(result => {
      res.send({ movies: result.rows, total: result.count });
    })
    .catch(error => next(error));
});

//read a single movie resource
app.get("/movies/:movieId", (req, res, next) => {
  Movie.findByPk(req.params.movieId)
    .then(movie => {
      if (!movie) {
        res.status(404).end();
      } else {
        res.json(movie);
      }
    })
    .catch(error => next(error));
});

//update a single movie resource
app.put("/movies/:movieId", (req, res, next) => {
  Movie.findByPk(req.params.movieId)
    .then(movie => {
      if (movie) {
        movie.update(req.body).then(movie => res.json(movie));
      } else {
        res.status(404).end();
      }
    })
    .catch(error => next(error));
});

//delete a single movie resource
app.delete("/movies/:movieId", (req, res, next) => {
  Movie.destroy({ where: { id: req.params.movieId } })
    .then(number => {
      if (number === 0) {
        res.status(404).end();
      } else {
        res.status(202).json(number);
      }
    })
    .catch(error => next(error));
});

app.listen(port, () => console.log("listening on port " + port));
