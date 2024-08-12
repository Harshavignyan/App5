const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema

const topicSchema = new Schema({
    "topicname": { type: 'String' },
    "image":{ type: 'String' }
});

var Topic = mongoose.model('Topic', topicSchema);
module.exports = Topic