const mongoose  = require('mongoose')

mongoose.connect("mongodb+srv://sajalgarg2006:sajal123@cluster0.4ee1e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

const todoschema = mongoose.Schema({
    title : String,
    description : String,
    completed : Boolean,
})

const todos = mongoose.model('todos',  todoschema);
module.exports = {
    todos
}