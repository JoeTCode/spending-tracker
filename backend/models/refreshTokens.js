import mongoose from 'mongoose';
const { Schema } = mongoose;

const refreshTokenSchema = new Schema({
    tokenId: {
        type: String,
        required: true,
        unique: true,
    },
    uid: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    revoked: {
        type: Boolean,
        default: false,
    }
});

refreshTokenSchema.index({ tokenId: 1, revoked: 1 }, { unique: true });
export default mongoose.model('RefreshToken', refreshTokenSchema);