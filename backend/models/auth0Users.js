import mongoose from 'mongoose';
const { Schema } = mongoose;

const auth0UserSchema = new Schema({
    auth0Uid: {
        type: String,
        required: true,
        unique: true
    },
    // name: {
    //     type: String,
    //     trim: true,
    //     required: true,
    // },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastLoginAt: {
        type: Date,
    },
});

export default mongoose.model('Auth0User', auth0UserSchema);