import dotenv from 'dotenv';
import { User, File, Note, connectDatabase } from './database.js';
import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import multer from 'multer';

// Environment variables
dotenv.config();

// MongoDB connection
connectDatabase();

// Multer configuration
const upload = multer({ dest: './public/data/uploads' })

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

    .get(verifyToken, async (req, res) => {
        const user = await User.findById({ _id: req.cookies.userid })
        const username = user.name
        const notes = await Note.find({ owner: user }).populate("attachment")
        res.status(200).render("notes", { username, notes })
    })

    .post(upload.single('noteAttachment'), async (req, res) => {
        const owner = req.cookies.userid
        const title = req.body.noteTitle
        const body = req.body.noteBody

        async function upload() {
            if (req.file !== undefined && req.file.size < 5000000) {
                const attachmentData = {
                    path: req.file.path,
                    fileName: req.file.originalname,
                    fileSize: `${(req.file.size * 0.000009765625).toFixed(2)} MB`,
                    owner
                }
                const file = await File.create(attachmentData)
                file.save()
                return file.id
            } return null
        };

        const noteToSave = new Note({ title, body, attachment: await upload(), owner });
        noteToSave.save();

        res.redirect("/notes");
    })


app.get("/download/:file", async (req, res) => {
    const file = await File.findById({ _id: req.params.file })
    res.download(`${file.path}`, file.fileName)
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
            cookies(res, user)

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

            if (existingUser && bcrypt.compareSync(password, existingUser.password)) {

                const token = jwt.sign(
                    { user_id: existingUser._id, email },
                    process.env.TOKEN_KEY,
                    { expiresIn: "1h" }
                );

                // Save token
                existingUser.token = token;

                // Redirect
                cookies(res, existingUser)

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
        clearCookies(res)
    });


app.use("*", (req, res) => {
    res.redirect('/login');
});


// Create cookies and redirect
function cookies(res, existingUser) {
    const expire = new Date(Date.now() + 1 * 3600000) // cookie will be removed after 1 hour
    return res
        .status(201)
        .cookie('x-access-token', existingUser.token, {
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
};

function clearCookies(res) {
    res
        .clearCookie('x-access-token', 'loggedin', 'userid')
        .clearCookie('loggedin')
        .clearCookie('userid')
        .redirect('/login')
};

app.listen(port, () => { console.log(`Server running on port ${port}`) });