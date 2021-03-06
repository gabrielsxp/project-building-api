const Building = require('../models/building');
const Floor = require('../models/floor');

/*
    Middleware de fluxo que fornece ao objeto de request, todas as informações sobre o
    prédio da rota atual. Todos os andares são populados no objeto de edifício. Permite
    que o fluxo de controle sobre cada edifício seja facilitado.
*/

const flow = async (req, res, next) => {
    try {
        const building = await Building.findOne({ name: req.params.name });
        await building.populate('floors').execPopulate();
        await building.populate('users').execPopulate();
        if (!building) {
            return res.status(404).send({ error: 'Prédio não encontrado !' });
        }
        req.building = building;
        const floor = building.floors[req.params.floor - 1];
        req.floor = floor;
        
        const floorsUsers = await building.getLotation();
        req.users = building.users + floorsUsers;
        req.floorusers = floorsUsers;
        req.hallUsers = building.users;
    } catch (error) {
        res.status(500).send(error);
    }
    next();
}

module.exports = flow;