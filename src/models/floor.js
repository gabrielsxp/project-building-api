const mongoose = require('mongoose');

/*
    Modelo que permite a atribuição de dados conhecidos sobre o banco de dados.
    Define os atributos, seus tipos, validações.
*/

const floorSchema = mongoose.Schema({
    number: {
        type: Number,
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    belongsTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Building'
    },
    allows: [{
        type: String,
        trim: true,
        lowercase: true
    }]
});

floorSchema.virtual('users', {
    ref: 'User',
    localField: '_id',
    foreignField: 'visits',
    count: true
});

/*
    Métodos sobre o esquema, permite que um objeto que instancia o modelo consiga
    implementar cada método.
*/

floorSchema.methods.verifyLotation = async function(role){
    if(role === 'employee' || role === 'clean'){
        return true;
    }
    const floor = this;
    try {
        await floor.populate('users').execPopulate();
        if(floor.users > floor.capacity){
            return false;
        }

        return true;
    } catch(error){
        throw new Error(error);
    }
}


floorSchema.methods.isFull = async function(){
    const floor = this;
    try {
        await floor.populate('users').execPopulate();
        if(floor.users <= floor.capacity){
            return false;
        }
        return true;
    } catch(error){
        throw new Error(error);
    }
}

floorSchema.methods.getLotation = async function(){
    const floor = this;
    try {
        const users = await floor.populate('users').execPopulate();
        return users;
    } catch(error){
        throw new Error(error);
    }
}

floorSchema.methods.allowsAccess = function(role){
    const floor = this;
    return floor.allows.includes(role);
}

const Floor = mongoose.model('Floor', floorSchema);

module.exports = Floor;