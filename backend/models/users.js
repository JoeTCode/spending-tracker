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
        lowercase: true,
        trim: true,
        required: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastLoginAt: {
        type: Date,
    },
});

export default mongoose.model('User', userSchema);