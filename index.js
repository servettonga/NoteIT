import * as dotenv from 'dotenv'
import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient, ServerApiVersion } from 'mongodb';
import * as mongoose from 'mongoose';

dotenv.config()

// Database link
// const dataBaseName = "notesDB"
// const local = "mongodb://127.0.0.1:27017/"
// mongoose.connect(`${local}${dataBaseName}`);

// const user = process.env.USER
// const pass = process.env.PASS
// const dbName = "notesAPP"
// const uri = `mongodb+srv://${user}:${pass}@cluster0.8d8eomw.mongodb.net/${dbName}`;
// mongoose.connect(uri)


// Epxress settings
const app = express();
const port = 3000
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
    res.render('notes')
});

app.get("/login", async (req, res) => {
    res.render('login')
});


app.post("/", (req, res) => {
    res.redirect("/");
});

// Server settings
app.listen(port, () => {
    console.log(`Server started on port ${port}`)
});

