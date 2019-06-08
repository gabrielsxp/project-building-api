const mongoose = require('mongoose');
const Floor = require('../models/floor');

/*
    Modelo que permite a atribuição de dados conhecidos sobre o banco de dados.
    Define os atributos, seus tipos, validações.
*/

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
    floorsCapacity: {
        type: Number,
        default: 20
    },
    floors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Floor',
        required: true
    }],
    img: {
        type: Number,
        default: 1
    }
});

buildingSchema.virtual('users', {
    ref: 'User',
    localField: '_id',
    foreignField: 'enters',
    count: true
});

/*
    Métodos sobre o esquema, permite que um objeto que instancia o modelo consiga
    implementar cada método.
*/

buildingSchema.methods.getLotation = async function () {
    const building = this;
    try {
        await building.populate('users').execPopulate();
        await building.populate('floors').execPopulate();

        var countUsers = 0;

        for (const floor of building.floors) {
            await floor.populate('users').execPopulate();
            countUsers += floor.users;
        }
    } catch(error){
        throw new Error(error);
    }
    return countUsers + building.users;
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

/*
    Middleware que intercepta a requisição sobre o edifício antes que seja salva no banco de dados.
    Essa função está definindo qual imagem será mostrada no front-end baseando-se nos intervalos de
    andares
*/

buildingSchema.pre('save', async function (next) {
    const building = this;
    if(building.numberOfFloors >= 1 && building.numberOfFloors <= 6){
        building.img = 4;
    } else if(building.numberOfFloors >= 7 && building.numberOfFloors <= 11){
        building.img = 3;
    } else if(building.numberOfFloors >= 12 && building.numberOfFloors <= 15){
        building.img = 1;
    } else if(building.numberOfFloors >= 16 && building.numberOfFloors <= 21){
        building.img = 0;
    } else {
        building.img = 2;
    }
    for (let i = 1; i <= building.numberOfFloors; i++) {
        const floor = new Floor({
            number: i,
            capacity: building.floorsCapacity,
            belongsTo: building._id,
            allows: ['visitor', 'admin', 'employee']
        });
        try {
            await floor.save();
            building.floors = building.floors.concat(floor._id);
            building.name = building.name.replace(/\s+/g, '-');
        } catch (error) {
            throw new Error(error);
        }
    }
    next();
});

const Building = mongoose.model('Building', buildingSchema);

module.exports = Building;