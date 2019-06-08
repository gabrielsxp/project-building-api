const Building = require('../models/building');
const Floor = require('../models/floor');

/*
    Middleware de controle sobre todos os edifícios. Basicamente o objeto de request recebe 
    todos os objetos que se referem aos edifícios do complexo. Isso permite que funções de 
    contagem sejam aplicadas sobre todo o complexo.
*/

const control = async (req, res, next) => {
    try {
        const buildings = await Building.find({});
        var capacity = 0;
        for(const building of buildings){
            capacity += building.numberOfFloors * building.floorsCapacity + building.floorsCapacity 
        }
        req.buildings = buildings;
        req.capacity = capacity;
    } catch (error) {
        res.status(500).send(error);
    }
    next();
}

module.exports = control;