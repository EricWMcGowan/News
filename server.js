// requiring external packages
var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var mongojs = require("mongojs");
var cheerio = require("cheerio");
var axios = require("axios");

// require models for moongoose db structure
var db = require("./models");

var PORT = process.env.PORT || 3000;

var app = express();

// Using morgan logger for logging requests
app.use(logger("dev"));

//parse request as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//making the public folder static
app.use(express.static("public"));

//Mongo DB connection
// mongoose.connect(
//     process.env.MONGODB_URI ||
//     "mongodb://user:password1@ds129085.mlab.com:29085/heroku_xpll97dg",{useMongoClient: true});
mongoose.connect("mongodb://localhost/yahoo-news", { useNewUrlParser: true });


// Routes

app.get("/", function(req, res) {
    res.json(path.join(__dirname, "/index.html"));
  });  

//A GET route for scraping the yahoo site
app.get("/scrape", function (req, res) {

    // site to scrape articles
    axios.get("https://www.yahoo.com/news/").then(function (response) {

        // Load the HTML into cheerio and save it to a variable
        var $ = cheerio.load(response.data);
        // console.log(response.data)

        // Grab every h3 on the page.
        $("div h3").each(function (i, element) {

            // An empty array to save the data that we'll scrape
            var result = {};
            //console.log ("element: ",element)

            result.title = $(this)
                .children("a")
                .text();
            result.link = $(this)
                .children("a")
                .attr("href");

            console.log("Result: ", result)

            // Create a new Article using the `result` object built from scraping
            db.Article.create(result)
                .then(function (dbArticle) {
                    // View the added result in the console
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    // If an error occurred, log it
                    console.log(err);
                });
        });
        // Send a message to the user
        // alert("Scrape Complete");
        res.send("Scrape Complete");
        // console.log ("Scrape Complete");
        // res.redirect("/");

    });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    db.Article.find({})
        .populate('Note')
        .then(function (dbArticle) {
            res.json(dbArticle)
        })
        .catch(function (err) {
            res.json(err)
        });
})

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
    db.Article.findOne({
        "_id": mongojs.ObjectId(req.params.id)
    }).then(function (dbArticle) {
        res.json(dbArticle)
    })
        .catch(function (err) {
            res.json(err)
        })
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
    db.Note.create(req.body)
        .then(function (dbNote) {
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err)
        })
});

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
