const mongoose = require('mongoose');
const Floor = require('../models/floor');

const buildingSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },
    capacity: {
        type: Number,
        required: true,
        validate(value) {
            if (value < 0) {
                throw new Error('Capacity must be postive')
            }
        }
    },
    numberOfFloors: {
        type: Number,
        default: 1
    },
    floors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Floor',
        required: true
    }]
});

buildingSchema.virtual('users', {
    ref: 'User',
    localField: '_id',
    foreignField: 'enters',
    count: true
});

buildingSchema.methods.getLotation = async function () {
    const building = this;
    await building.populate('floors').execPopulate();

    var countUsers = 0;

    for (const floor of building.floors) {
        await floor.populate('users').execPopulate();
        countUsers += floor.users;
    }

    return countUsers;
}

buildingSchema.methods.checkLotation = async function(role){
    if(role.match('employee')){
        return true;
    }
    try {
        await this.populate('users').execPopulate();
        return this.capacity >= (this.users + 1);
    } catch(error){
        throw new Error(error);
    }
}

buildingSchema.pre('save', async function (next) {
    const building = this;
    for (let i = 1; i <= this.numberOfFloors; i++) {
        const floor = new Floor({
            number: i,
            capacity: 50,
            belongsTo: building._id,
            allows: ['visitor', 'admin', 'employee']
        });
        try {
            await floor.save();
            building.floors = building.floors.concat(floor._id);
            building.name = building.name.replace(/\s+/g, '-');
        } catch (error) {
            return res.status(400).send('Problem trying to save the floor');
        }
    }
    next();
});

const Building = mongoose.model('Building', buildingSchema);

module.exports = Building;