const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema
const adminSchema = new Schema({
    "adminemail": { type: 'String' },
    "adminpassword": { type: 'String'},
    "adminusername": { type: 'String'},
    "admincontact":{type: 'String'}
});

var Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin