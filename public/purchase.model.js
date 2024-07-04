const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema
const purchaseSchema = new Schema({
    "username": { type: 'String' },
    "coursename":['String']
});

var Purchase = mongoose.model('Purchase', purchaseSchema);
module.exports = Purchase