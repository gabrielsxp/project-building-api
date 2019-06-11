const Building = require('../models/building');
const Floor = require('../models/floor');

/*
    Middleware de fluxo que fornece ao objeto de request, todas as informações sobre o
    prédio da rota atual. Todos os andares são populados no objeto de edifício. Permite
    que o fluxo de controle sobre cada edifício seja facilitado.
*/

const stats = async (req, res, next) => {
    try {
        const building = await Building.findOne({ name: req.params.name });
        await building.populate('floors').execPopulate();
        await building.populate('users').execPopulate();
        if (!building) {
            return res.status(404).send({ error: 'Prédio inexistente' });
        }
        req.building = building;
        var users = 0;
        for(const floor of building.floors){
            users += await floor.getLotation();
        }
        
        req.users = building.users + users;
    } catch (error) {
        res.status(500).send(error);
    }
    next();
}

module.exports = stats;