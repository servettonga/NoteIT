import dotenv from 'dotenv';
import { connectDatabase } from './database.js';
import { User, File, Note } from './models.js';
import { verifyToken, createCookies, extendCookies, clearCookies } from './functions.js';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import fs from 'fs';
import bytes from 'bytes';


// app settings ----------------------------------------------------------------

// Environment variables
dotenv.config();

// MongoDB connection
connectDatabase();

// Multer configuration
const upload = multer({ dest: './public/data/uploads' })

// Express settings
const port = process.env.API_PORT
const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());


// Routes ----------------------------------------------------------------

// Registration
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
            createCookies(res, user)

        } catch (err) {
            console.log(err);
        }
    });


// Notes
app.all('/notes', async (req, res, next) => {
    await verifyToken(req, res);
    next();
})

app.route("/notes")

    .get(async (req, res) => {
        extendCookies(req, res);
        const user = await User.findOne({ email: req.cookies.username })
        const username = user.name
        const notes = await Note.find({ owner: user }).populate('attachment')
        res.status(200).render("notes", { username, notes })
    })

    .post(upload.single('noteAttachment'), async (req, res) => {
        const owner = await User.findOne({ email: req.cookies.username })
        const title = req.body.noteTitle
        const body = req.body.noteBody

        async function upload() {
            if (req.file !== undefined && req.file.size < 5000000) {
                const attachmentData = {
                    path: req.file.path,
                    fileName: req.file.originalname,
                    fileSize: bytes.format(req.file.size, { unitSeparator: ' ' }),
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


// Download attachment
app.get("/notes/download/:file", async (req, res) => {
    const file = await File.findById({ _id: req.params.file })
    res.download(`${file.path}`, file.fileName)
});


// Update or delete items
app.post("/notes/update/:id", async (req, res) => {
    const id = req.params.id;
    const done = (req.body.done)
    const button = (req.body.button)

    if (button) {
        const note = await Note.findById({ _id: id })
        const attachment = await File.findById({ _id: note.attachment._id })
        fs.unlink(`./${attachment.path}`, err => { if (err) console.log(err) })
        await File.deleteOne(attachment);
        await Note.deleteOne(note);

    }
    if (done) {
        await Note.updateOne({ _id: id }, { done });
    }

    res.redirect("/notes");
});


// Login user
app.route("/login")

    .get(async (req, res) => {
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
                createCookies(res, existingUser)

            } else {
                res
                    .status(400)
                    .render("login", { warning: "Invalid username or password", username: '' })
            }

        } catch (err) {
            console.log(err);
        };
    });


// Logout user and clear cookies
app.route("/logout")

    .get((req, res) => {
        clearCookies(res)
    });


// 404
app.use("*", (req, res) => {
    res.redirect('/login');
});


// Run server ----------------------------------------------------------------
app.listen(port, () => { console.log(`Server running on port ${port}`) });