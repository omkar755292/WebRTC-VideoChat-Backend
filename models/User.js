const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    user_id: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true, trim: true },
    userPassword: { type: String, required: true, trim: true }
}, { timestamps: true });

const User = mongoose.model('User', schema);

module.exports = User;
