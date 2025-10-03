import mongoose from 'mongoose';
const { Schema } = mongoose;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    username: {
        type: String,
        unique: true,
        sparse: true, // allows multiple nulls if users did not login via auth0, else enforce uniqueness
        lowercase: true,
        trim: true,
    },
    passwordHash: {
        type: String,
    },
    auth0Id: {
        type: String,
        unique: true,
        sparse: true, // allows multiple nulls if users did not login via auth0, else enforce uniqueness
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastLoginAt: {
        type: Date,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    modelBlob: {
        type: Buffer,
        default: null,
    }
});

export default mongoose.model('User', userSchema);