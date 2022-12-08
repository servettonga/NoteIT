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
