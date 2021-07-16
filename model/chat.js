
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var chatSchema = new Schema({
  name: String,
  chat: String,
})


const Chat = mongoose.model('chat', chatSchema);
module.exports = Chat;