const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref:'user', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref:'user', required: true },
    message: [{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        message: {
            type: String
        }
    }],
    private: {
        type: Boolean,
        default: false
    },
});

module.exports = mongoose.model('Message', messageSchema);