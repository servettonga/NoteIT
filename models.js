import mongoose, { Schema } from 'mongoose';
import { format } from 'date-fns';


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
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
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

userSchema.virtual("notes", {
    ref: "Note",
    foreignField: "owner",
    localField: "_id"
});

userSchema.virtual("files", {
    ref: "File",
    foreignField: "owner",
    localField: "_id"
});

export const Note = mongoose.model("Note", noteSchema);

export const File = mongoose.model("File", fileSchema);

export const User = mongoose.model("User", userSchema);