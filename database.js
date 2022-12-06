import mongoose from 'mongoose';
import dotenv from 'dotenv';

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

const userSchema = new mongoose.Schema({
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

const fileSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    fileSize: String,
    owner: mongoose.SchemaTypes.ObjectId
});

export const File = mongoose.model("File", fileSchema);

export const User = mongoose.model("User", userSchema);