import mongoose from 'mongoose';
const { Schema } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true, // no duplicate usernames
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
    }
});

userSchema.index({ username: 1 }, { unique: true });
export default mongoose.model('User', userSchema);