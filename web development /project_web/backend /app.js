const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');
const JWT_SECRET = 'secret';
const MONGO_URI = ''


const auth = (req,res,next)=>{
    const token = req.header('Authorization');
    if(!token) return res.status(401).send({error:'Access denied. No token'});
    const ans = jwt.verify(token,JWT_SECRET);
    if(!ans) return res.status(400).send({error:'Invalid token'});
    req.user = ans;
    next();
}

const userSchema = new mongoose.Schema({
    username : String ,
    email_id :  String,
    password : String ,
})

mongoose.connect(MONGO_URI)
    .then(() => console.log('connected to database'))
    .catch(error => console.log('error has occurred', error));

// mongoose.Schema('user_1' , userSchema);  

const User = mongoose.model('user_1' , userSchema);
app.use(express.json());
app.post('/register' , async (req , res)=>{
    const {username , email_id , password} = req.body;
    const user = new User({
        username : username,
        email_id : email_id,
        password : password,
    });
    try{
    await user.save();
    res.send('user created');
    }
    catch {
        res.status(500).send('Error creating user');
    }
})
app.post('/login', async (req, res) => {
    const { email_id, password } = req.body;
    const user = await User.findOne({ email_id });

    if (!user) {
        return res.status(404).send('user not found');
    }

    if (password !== user.password) {
        return res.status(400).send('incorrect password');
    }

    const token = jwt.sign(
        {
            user_id: user._id,
            username: user.username,
            email_id: user.email_id,
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.status(200).send({
        message: "user found, welcome to the codebase",
        user,
        token,
    });
});

