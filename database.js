import mongoose, { Schema } from 'mongoose';
import dotenv from 'dotenv';
import { format } from 'date-fns';

dotenv.config();

// Database link
const uri = process.env.MONGO_URI

export function connectDatabase() {
    mongoose.connect(uri)
        .then(() => {
            console.log("Conntected to the database");
        })
        .catch((err) => {
            console.log("Error");
            console.error(err);
            process.exit(1);
        });
};

const userSchema = new Schema({
    name: {
        type: String,
        unique: false,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
    },
    token: {
        type: String
    }
});

const fileSchema = new Schema({
    fileName: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    fileSize: String,
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

const noteSchema = new Schema({
    done: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        required: true
    },
    body: String,
    date: {
        type: String,
        default: format(new Date(), 'dd MMMM yyyy')
    },
    attachment: {
        type: Schema.Types.ObjectId,
        ref: 'File'
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

export const Note = mongoose.model("Note", noteSchema);

export const File = mongoose.model("File", fileSchema);

export const User = mongoose.model("User", userSchema);