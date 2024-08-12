const { default: mongoose } = require("mongoose");

const coursefeeSchema = new mongoose.Schema({
    coursename: { type: 'String' },
    discount: { type: 'Number' },
    discountedprice: { type: 'Number' },
    amountpaid: { type: 'Number' },
    duedate: {type: 'Date' },
    status: { type: 'String' },
    proof: { type: 'Boolean' },
    file: { type: 'String' }
  });

const Schema = mongoose.Schema
const userSchema = new Schema({
    "email": { type: 'String' },
    "password": { type: 'String'},
    "username": { type: 'String'},
    "courses" : { type: [coursefeeSchema] }
});

var User = mongoose.model('User', userSchema);
module.exports = User