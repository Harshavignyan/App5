const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema
const userSchema = new Schema({
    "email": { type: 'String' },
    "password": { type: 'String'},
    "username": { type: 'String'},
    "courses" : ['String'],
    "purchases" : ['String']
});

var User = mongoose.model('User', userSchema);
module.exports = User