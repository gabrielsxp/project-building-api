const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        trim: true,
        validate(value){
            if(!validator.isNumeric(value)){
                throw new Error('The password must contain only numbers');
            }
            if(value.length !== 6){
                throw new Error('The password must constains exactly 6 numbers');
            }
        }
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid');
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    role: {
        type: String,
        default: 'employee'
    },
    visits: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Floor'
    },
    enters: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Building'
    }
});

userSchema.statics.findByCredentials = async (email, password) => {
    const check = validator.isNumeric(password);
    if(!check){
        throw new Error('The password must contain only numbers and must have 6 characters');
    }
    try {
        const user = await User.findOne({email});
        if(!user){
            return null;
        }
        const matchPasswords = await bcrypt.compare(password, user.password);
        if(!matchPasswords){
            throw new Error({error: 'Incorret Credentials !'});
        }
        return user;
    } catch(error){
        throw new Error(error);
    }
}

userSchema.methods.toJSON = function(){
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;

    return userObject;
}

userSchema.methods.generateAuthToken = async function(){
    const user = this;
    const token = await jwt.sign({ _id: user._id.toString() }, '9adbe0b3033881f88ebd825bcf763b43');

    user.tokens = user.tokens.concat({ token });
    await user.save();

    return token;
}

userSchema.virtual('floors', {
    ref: 'Floor',
    localField: '_id',
    foreignField: 'belongsTo'
});

userSchema.pre('save', async function(next){
    const user = this;

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;