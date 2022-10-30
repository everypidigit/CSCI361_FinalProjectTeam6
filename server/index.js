const express = require('express');
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const jwt = require("jsonwebtoken");

const app = express();
const saltRound = 10;

const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "",
    database: "loginsystem",
});

module.exports = db;

app.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    
    bcrypt.hash(password, saltRound, (err, hash) => {
        if (err) {
            console.log(err)
         }
        db.execute(
            "INSERT INTO users (username. password) VALUES (?,?)",
            [username, hash],
            (err, result) => {
                console.log(err);
            }
        );
    })
});

app.get('/isUserAuth', verifyJWT, (req, res) => {
    res.send("you are authenticated Congrats:")
})

const verifyJWT = (req, res, next) => {
    const token = req.headers["x-access-token"];    if (!token) {
        res.send("We need a token, please give it to us next time");
    } else {
        jwt.verify(token, "jwtSecret", (err, decoded) => {
            if (err) {
                console.log(err);
                res.json({ auth: false, message: "you are failed to authenticate"});
            } else {
                req.userId = decoded.id;
                next();
            }
        });
    }
};

app.get("/login", (req, res) => {
    if (req.session.user) {
      res.send({ loggedIn: true, user: req.session.user });
    } else {
      res.send({ loggedIn: false });
    }
  });

app.post('/login', (req, res) => {

    const username = req.body.username;
    const password = req.body.password;
    
    db.execute(
        "SELECT * FROM users WHERE username = ?;",
        [username], 
        (err, result)=> {
            if (err) {
                res.send({err: err});
            }    if (result.length > 0) {
               bcrypt.compare(password, result[0].password, (error, response) => {
                    if (response) {
                        const id = result[0].id
                        const token = jwt.sign({id}, "jwtSecret", {
                            expiresIn: 300,
                        })
                        req.session.user = result;
                        console.log(req.session.user);
                        res.json({auth: true, token: token, result: result});
                    } else{
                        res.json({auth: false, message: "Wrong username password"});
                    }
                });
          } else {
            res.json({auth: false, message: "no user exists"});
          }
        }
    );
});

app.use(
    cors({
        origin: ["http://localhost:3000/"],
        methods: ["GET", "POST"],
        credentials: true,
    })
);

//  initializing cookie and body parser
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

// initializaing the express session
app.use(
    session({
        key: "userId",
        secret: "doodle",
        resave: false,
        saveUninitialized: false,
        cookie: {
            expires: 60*60*24,
        },
    })
);

app.use(express.json());

app.listen(3001, () => {
   console.log('running server');
})