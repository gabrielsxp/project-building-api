const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/*
    Modelo que permite a atribuição de dados conhecidos sobre o banco de dados.
    Define os atributos, seus tipos, validações.
*/

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email com formato inválido');
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

/*
    Funções estáticas definem para o Modelo em si, procedimentos que serão executados
    independentemente dos atributos dos objetos que o instanciam, uma vez que não estão
    definidos ainda
*/

userSchema.statics.findByCredentials = async (email, password) => {
    const check = validator.isNumeric(password) && password.length === 6;
    if(!check){
        throw new Error('A senha deve ser númerica e conter exatamente 6 dígitos');
    }
    try {
        const user = await User.findOne({email});
        if(!user){
            return null;
        }
        const matchPasswords = await bcrypt.compare(password, user.password);
        if(!matchPasswords){
            throw new Error('Credenciais inválidas. Tente novamente !/');
        }
        return user;
    } catch(error){
        throw new Error(error);
    }
}


/*
    Métodos sobre o esquema, permite que um objeto que instancia o modelo consiga
    implementar cada método.
*/

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