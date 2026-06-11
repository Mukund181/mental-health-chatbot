const mongoose = require("mongoose");

const msgSchema = new mongoose.Schema({
    username : {
        type : String,
        required : true
    },
    message : {
        type : String,
        required : true
    },
    type : {
        type : String,
        enum : ['sent', 'received'],
        required :true
    },
    botResponse : {
        type : String
    },
    date : {
        type : Date,
        default : Date.now
    }
});

module.exports = mongoose.model("Message", msgSchema);