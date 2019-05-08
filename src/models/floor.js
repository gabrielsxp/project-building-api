const mongoose = require('mongoose');

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

floorSchema.methods.verifyLotation = async function(role){
    if(role === 'employee' || role === 'clean'){
        return true;
    }
    const floor = this;
    await floor.populate('users').execPopulate();
    if(floor.users > floor.capacity){
        return false;
    }
    return true;
}

floorSchema.methods.allowsAccess = function(role){
    const floor = this;
    return floor.allows.includes(role);
}

const Floor = mongoose.model('Floor', floorSchema);

module.exports = Floor;