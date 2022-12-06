import dotenv from 'dotenv';
import { User, File, connectDatabase } from './database.js';
import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

// Environment variables
dotenv.config();

// MongoDB connection
connectDatabase();

// Express settings
const port = process.env.API_PORT
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());


// Token verification
const verifyToken = (req, res, next) => {
    const token = req.body.token || req.query.token || req.headers["x-access-token"] || req.cookies["x-access-token"];

    if (!token) {
        return res.status(403).redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);
        req.user = decoded;
    } catch (err) {
        return res.status(401).redirect('/login')
    }

    return next();
};


// Routes

app.route("/notes")

    .get(verifyToken, (req, res) => {
        res.status(200).render("notes")
    })


app.route("/register")

    .post(async (req, res) => {
        try {
            // User input
            const { name, email, password } = req.body;

            // Validate
            if (!(name && email && password)) {
                res.status(400).send("All inputs are required");
            };

            // User exists?
            const existingUser = await User.findOne({ email });

            if (existingUser) {
                return res.status(409).send("User already exists.");
            };

            // Encryption
            const encryptedPassword = await bcrypt.hash(password, 10);

            // Create user
            const user = await User.create({
                name: name,
                email: email.toLowerCase(),
                password: encryptedPassword
            });

            // Create token and save
            const token = jwt.sign(
                { user_id: user._id, email },
                process.env.TOKEN_KEY,
                { expiresIn: "1h" }
            );

            user.token = token;

            // return new user
            res.status(201).json(user);

        } catch (err) {
            console.log(err);
        }
    });


app.route("/login")

    .get((req, res) => {
        if (req.cookies.loggedin) {
            res.redirect('/notes')
        } else {
            res.render('login', { warning: false, username: req.cookies.username })
        }
    })

    .post(async (req, res) => {

        // Login
        try {
            // User input
            const { email, password } = req.body

            // Validation
            if (!(email && password)) {
                res.status(400).send("All inputs are required");
            }

            /// Check whether user exists
            const existingUser = await User.findOne({ email });

            if (existingUser && await bcrypt.compare(password, existingUser.password)) {

                const token = jwt.sign(
                    { user_id: existingUser._id, email },
                    process.env.TOKEN_KEY,
                    { expiresIn: "1h" }
                );

                // save token
                existingUser.token = token;

                // redirect
                const expire = new Date(Date.now() + 1 * 3600000) // cookie will be removed after 1 hour
                res
                    .status(201)
                    .cookie('x-access-token', token, {
                        expires: expire
                    })
                    .cookie('loggedin', true, {
                        expires: expire
                    })
                    .cookie('userid', existingUser._id, {
                        expires: expire
                    })
                    .cookie('username', existingUser.email)
                    .redirect(301, '/notes')

            } else {
                res
                    .status(400)
                    .render("login", { warning: true, username: '' })
            }

        } catch (err) {
            console.log(err);
        };
    });


app.route("/logout")

    .get((req, res) => {

        // Logout and clear cookies 
        res
            .clearCookie('x-access-token', 'loggedin', 'userid')
            .clearCookie('loggedin')
            .clearCookie('userid')
            .redirect('/login')
    });


app.use("*", (req, res) => {
    res.redirect('/login');
});


app.listen(port, () => { console.log(`Server running on port ${port}`) });