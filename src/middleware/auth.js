const jwt = require('jsonwebtoken');
const User = require('../models/user');

/*
    Middleware de comunicação que implementa o mecanismo de autenticação utilizando Bearer Token
*/

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, '9adbe0b3033881f88ebd825bcf763b43');
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token});

        if(!user){
            throw new Error();
        }

        req.user = user;
        req.token = token;
        next();
    } catch(error) {
        res.status(401).send({error: 'Please authenticate !'});
    }
}

module.exports = auth;