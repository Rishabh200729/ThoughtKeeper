/**************************************THOUGHT KEEPER WEB APP *****************************************/
/* less specific
1.oauth authentication with google
2. work on the front end and give some finsihing touch-up.
*/

const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");

//specify what to use
const app = express();
mongoose.connect("mongodb://localhost:27017/thoughtdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.set('useFindAndModify', false);
mongoose.set('returnOriginal', false);
app.use(express.static("public"));
app.set("view engine", 'ejs');
app.use(bodyparser.urlencoded({
    extended: true
}));

//create schemas
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});
const postSchema = new mongoose.Schema({
    email: String,
    post: String,
    topic: String,
    like_count: {
        type: Number,
        default: 0
    }
});

const topicSchema = new mongoose.Schema({
    topic: String
});

//and their models
const User = mongoose.model("User", userSchema);
const Topic = mongoose.model("Topic", topicSchema);
const Post = mongoose.model("Post", postSchema);
/***********************GET ROUTES*********************************/
//home route
app.get("/", function(req, res) {
    res.render("home");
});
app.get("/about", function(req, res) {
    res.render("about");
});
//login route
app.get("/login", function(req, res) {
    res.render("login");
});
// compose route
app.get("/compose", function(req, res) {
    Topic.find({
        topic: {
            $ne: null
        }
    }, function(err, foundTopic) {
        var query = Topic.find();
        query.countDocuments(function(err, count) {
            if (err) {
                console.log(err);
            } else {
                const randomNumber = Math.floor(Math.random() * count);
                const myarr = [];
                Topic.find(function(err, foundtopics) {
                    foundTopic.forEach(function(topic) {
                        myarr.push(topic.topic);
                    });
                    const randomTopic = myarr[randomNumber];
                    res.render("compose", {
                        randomTopic: randomTopic
                    });
                });
            }
        });
    });
});
//register route
app.get("/register", function(req, res) {
    res.render("register");
});
//show topics
app.get("/topics", function(req, res) {
    
    Topic.find({
        topic: {
            $ne: null
        }
    }, function(err, foundTopic) {
        if (err) {
            console.log(err);
        } else {
            if (foundTopic) {
                console.log(foundTopic);
                res.render("topics", {
                    newtopic: foundTopic
                });
            }
        }
    });
});
//show existing posts
app.get("/posts", function(req, res) {
    Post.find(function(err, foundPosts) {
        if (err) {
            console.log(err);
        } else {
            res.render("posts", {
                user: foundPosts
            });
        }
    });
});
app.get("/posts/:postName", function(req, res) {
    const requestedTitle = _.lowerCase(req.params.postName);
    Post.find(function(err, foundPosts) {
        if (err) {
            console.log(err);
        } else {
            foundPosts.forEach(function(post) {
                let storedTitle = _.lowerCase(post.topic);
                if (storedTitle.replace(/\s/g, "") === requestedTitle.replace(/\s/g, "")) {
                    const post_content = post.post;
                    res.render("singlepost", {
                        single_post: post_content,
                        no_of_likes: post.like_count
                    });
                }
            });
        }
    });
});
app.get("/leader-board", function(req, res) {
    Post.find().sort({
        like_count: -1
    }).exec(function(err, doc) {
        res.render("leaderboard", {
            post: doc
        });
    });
});
/***********************POST ROUTES*********************************/
//upate the schema incrementimng likes by 1 or decremenrt by 1
//do the same for comments which should be a array.
app.post("/posts/:post_topic", function(req, res) {
    let form_action = req.body.action;
    form_action = req.params.post_topic;
    const post_title = req.params.post_topic.replace("/posts/", "");
    let post_comment = req.body.userComment;
    const filter = {
        topic: post_title
    };
    const update = {
        $inc: {
            like_count: +1
        }
    };
    // filter and update and options and callback
    Post.findOneAndUpdate(filter, update, {
        new: true
    }, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            res.redirect(form_action);
        }
    });
});
//submit a post
app.post("/posts", function(req, res) {
    const email = req.body.email;
    let typedText = req.body.userInput;
    let userSpeech = req.body.userSpeech;
    if (typedText.length > userSpeech.length) {
        const topic = typedText.substring(0, 7);
        const requiredTitle = topic.replace(/\s/g, "")
        const newPost = new Post({
            topic: _.lowerCase(requiredTitle),
            email: email,
            post: typedText
        });
        newPost.save();
        console.log(newPost);
    } else if (userSpeech.length > typedText.length) {
        const newPost = new Post({
            topic: topic,
            email: email,
            post: userSpeech
        });
        newPost.save();
        console.log(newPost);
    }
    Post.find({
        email: email
    }, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/posts");
        }
    });

});
// confirm a user
app.post("/confirm", function(req, res) {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({
        email: email
    }, {
        password: password
    }, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                console.log(foundUser.email);
                res.redirect("/compose");
            }
        }
    });
});
//add a new custom topic
app.post("/topics", function(req, res) {
    const email = req.body.email;
    const password = req.body.password;
    const userTopic = req.body.topicname;
    User.find({
        email: email
    }, {
        password: password
    }, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                const newtopic = new Topic({
                    topic: userTopic
                });
                newtopic.save();
                console.log(newtopic);

                Topic.find({
                    "topic": {
                        $ne: null
                    }
                }, function(err, foundTopic) {
                    if (err) {
                        console.log(err);
                    } else {
                        if (foundTopic) {
                            console.log(foundTopic);
                            res.redirect("/topics");
                        }
                    }
                });
            }
        }
    });
});
//register  a user
app.post("/register", function(req, res) {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    });
    console.log(user);
    //check if the user has typed in every entry if not then redirected to login page

    function checkingValidUser(foundUser) {
        if (foundUser.name != "" && foundUser.email != "") {
            console.log("the found user is :" + foundUser);
            console.log('successfully inserted user');
            foundUser.save(function(err, validuser) {
                res.render("posts");
            });
            res.redirect("/posts");
        } else {
            console.log(foundUser);
            console.log("invalid user");
            res.redirect("/register");
        }
    }
    checkingValidUser(user);
});

//login a user
app.post("/login", function(req, res) {
    const loginnedemail = req.body.email;
    const password = req.body.password;
    User.findOne({
        email: loginnedemail
    }, function(err, founduser) {
        if (err) {
            console.log(err);
        } else {
            if (founduser) {
                res.redirect("/posts");
            } else {
                console.log("invalid user");
                res.redirect("/login");
            }
        }
    });
});
app.listen(3000, function() {
    console.log("Server started on port 3000");
});