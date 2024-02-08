const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectToDatabase } = require('../utils/dbUtils');

connectToDatabase()
    .then(() => console.log('Connection Established'))
    .catch((err) => console.log(err));

const db = mongoose.connection;

const userSchema = mongoose.Schema({
    name: {
        type: String,
        index: true
    },
    password: {
        type: String
    },
    email: {
        type: String
    },
    profileimage: {
        type: String
    },
    uname: {
        type: String
    },
    contact: {
        type: Number
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
});

const User = module.exports = mongoose.model('user', userSchema);

module.exports.getUserById = async function (id) {
    return await User.findById(id);
};

module.exports.getUserByUsername = async function (username) {
    const query = { uname: username };
    return await User.findOne(query);
};

module.exports.comparePassword = async function (candidatepassword, hash) {
    return await bcrypt.compare(candidatepassword, hash);
};

module.exports.createUser = async function (newUser) {
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(newUser.password, salt);
    return await newUser.save();
};
