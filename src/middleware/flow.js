const Building = require('../models/building');
const Floor = require('../models/floor');

const flow = async (req, res, next) => {
    try {
        const building = await Building.findOne({ name: req.params.name });
        await building.populate('floors').execPopulate();
        await building.populate('users').execPopulate();
        if (!building) {
            return res.status(404).send({ error: 'Building not found' });
        }
        req.building = building;
        req.floor = building.floors[req.params.floor - 1];
        
        const floorsUsers = await building.getLotation();
        req.users = building.users + floorsUsers;
    } catch (error) {
        res.status(500).send(error);
    }
    next();
}

module.exports = flow;