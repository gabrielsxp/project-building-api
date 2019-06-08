const express = require('express');
const auth = require('../middleware/auth');
const flow = require('../middleware/flow');
const Building = require('../models/building');
const Floor = require('../models/floor');
const User = require('../models/user');
const control = require('../middleware/control');
const router = express.Router();

/*
    Rota responsável por lotar um edifício
*/

router.post('/building/:name/fill', flow, async (req, res) => {
    const building = req.building;
    try {
        var success = 0;

        var hallUsers = building.capacity - building.users;
        while(hallUsers >= 0){
            let name = Math.random().toString(36).substr(2, 9);
            let email = name+'@email.com';
            const user = new User({
            name,
            email,
            enters: building._id,
            visits: null
            });
            await user.save();
            hallUsers--;
            }
        for(let j = 0; j < building.floors.length; j++){
            var floor = await Floor.findById(building.floors[j]);
            var currentUsers = await floor.getLotation();
            var floorUsers = floor.capacity - currentUsers;
            while(floorUsers >= 0){
                const name = Math.random().toString(36).substr(2, 9);
                const email = name+'@email.com';
                const user = new User({
                name,
                email,
                enters: null,
                visits: floor._id
                });
                await user.save();
                floorUsers--;
            }
        }
        res.sendStatus(201);
    } catch(error){
        res.status(500).send({error: error.message});
    }
});

/*
    Rota responsável por criar um edifício
*/

router.post('/building', async (req, res) => {
    const body = req.body;
    const requiredFields = ['name', 'capacity', 'numberOfFloors', 'floorsCapacity'];
    const fields = Object.keys(body);
    const isValid = fields.every((field) => requiredFields.includes(field));

    if (!isValid) {
        return res.status(400).send('Incorrect Fields');
    }
    //Se os campos forem válidos
    try {
        const building = new Building(body);
        await building.save();
        res.status(201).send(building);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

/*
    Rota responsável por adicionar uma lista de edifícios de forma asíncrona
*/

router.post('/buildings', async (req, res) => {
    const body = req.body;

    var buildings = [];

    for(let i = 0; i < body.length; i++){
        buildings.push(new Building(req.body[i]));
    }

    for(const b of buildings){
        try {
            await b.save();
        } catch(error){
            res.status(400).send(error);
        }
    }

    res.sendStatus(201);
})

/*
    Rota responsável por remover um edifício
*/

router.delete('/buildings', async (req, res) => {
    try {
        const buildings = await Building.deleteMany({});
        res.sendStatus(200);
    } catch(error) {
        res.status(500).send({error: error.message});
    }
});

/*
    Rota responsável por retornar todos os edifícios
*/

router.get('/buildings', control, async(req, res) => {
    try {
        const buildings = req.buildings;
        const total = req.capacity;
        res.status(200).send({data: buildings, capacity: total});
    } catch(error){
        res.send(500).send({error: error.message});
    }
});

/*
    Rota responsável por retoronar um edifício baseado no nome
*/

router.get('/building/:name', flow, async (req, res) => {
    try {
        res.status(200).send({floors: req.building.floors, capacity: req.building.numberOfFloors * req.building.floorsCapacity + req.building.floorsCapacity });
    } catch(error){
        res.status(500).send({error: error.message});
    }
});

/*
    Rota responsável por realizar a autenticação de um usuário em um edifício
*/

router.post('/building/:name', flow, async (req, res) => {
    const fields = Object.keys(req.body);
    const requiredFields = ['name', 'email', 'password'];
    const isValid = fields.every((field) => requiredFields.includes(field));

    if (!isValid) {
        return res.status(400).send('Missing Credentials');
    }
    try {
        var user = null;
        if (!fields.includes('password')) {
            user = await User.findOne({ email: req.body.email });
            if (!user) {
                user = new User({ ...req.body, role: 'visitor' });
            }
        } else {
            user = await User.findByCredentials(req.body.email, req.body.password);
            if (!user) {
                user = new User(req.body);
            }
        }
        const canAccess = await req.building.checkLotation(user.role);
        console.log(canAccess);
        if(!canAccess){
            return res.status(401).send({error: 'The hall of the building is full'});
        }
        if (user.visits) {
            const floor = await Floor.findById(user.visits);
            const build = await Building.findById(floor.belongsTo);
            if (!build.name.match(req.building.name)) {
                return res.status(400).send({error: 'You cannot visit two buildings at the same time !'});
            }
            user.visits = null;
        } else if(user.enters){
            const build = await Building.findById(user.enters);
            if(!build.name.match(req.building.name)){
                return res.status(400).send({error: 'You cannot visit two buildings at the same time !'});
            }
        }

        var token = null;
        if (user.tokens.length === 0) {
            token = await user.generateAuthToken();
        }
        token = user.tokens[0].token;
        user.enters = req.building._id;
        await user.save();
        res.status(201).send({ user, token });
    } catch (error) {
        console.log(error);
        res.status(500).send({error: error.message});
    }
});

/*
    Rota responsável por remover todos os andares de todos os edifícios
*/

router.delete('/floors', async (req, res) => {
    try {
        await Floor.deleteMany({});
        res.sendStatus(200);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

/*
    Rota responsável por adicionar um andar a um edifício
*/

router.post('/building/:name/:floor', [auth, flow], async (req, res) => {
    const floor = req.floor;
    const checkLotation = await floor.verifyLotation(req.user.role);
    const allowsAccess = floor.allowsAccess(req.user.role);

    if (!allowsAccess) {
        return res.status(401).send('You don\'t have access level to enter this floor !');
    }
    if (!checkLotation) {
        return res.status(401).send('Floor with maximum capacity. Come back later');
    }

    const fields = Object.keys(req.body);
    const requiredFields = ['email', 'password'];
    const isValid = fields.every((field) => requiredFields.includes(field));

    if (!isValid) {
        return res.status(400).send('Incomplete credentials');
    }
    if (req.building.floors.length < req.params.floor) {
        return res.status(400).send({ error: 'Invalid Floor Number' });
    }
    try {
        if(req.user.role === 'employee'){
            const us = await User.findByCredentials(req.body.email, req.body.password);
            if(!us){
                return res.status(401).send('Wrong credentials!');
            }
        } else {
            const us = await User.findOne({email: req.body.email});
            if(!us){
                return res.status(401).send('Incorrect Email');   
            }
        }
        if (req.user.visits) {
            const floor = await Floor.findById(req.user.visits);
            const build = await Building.findById(floor.belongsTo);
            if (!build.name.match(req.building.name)) {
                return res.status(400).send('You cannot visit two buildings at the same time !');
            }
            req.user.visits = null;
        } else if(req.user.enters){
            const build = await Building.findById(req.user.enters);
            if(!build.name.match(req.building.name)){
                return res.status(400).send({error: 'You cannot visit two buildings at the same time !'});
            }
        }
        req.user.visits = floor._id;
        req.user.enters = null;
        await req.user.save();
        res.status(200).send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }
});

/*
    Rota responsável por permitir que um administrados altere características de um de um edifício
*/

router.patch('/building/:name/:floor', [auth, flow], async (req, res) => {
    if(!req.user.role.match('admin')){
        return res.status(401).send('You are not allowed to patch this url');
    }
    const requiredFields = ['capacity', 'allows'];
    const fields = Object.keys(req.body);
    const isValid = fields.every((field) => requiredFields.includes(field));

    if (!isValid) {
        return res.status(400).send('Required fields are missing !');
    }

    try {
        const floor = req.floor;
        fields.forEach((update) => floor[update] = req.body[update]);
        await floor.save();
        res.status(200).send(floor);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

/*
    Rota responsável por retornar a quantidade de pessoas que estão em um edifício no momento
*/

router.get('/building/:name/lotation', flow, async (req, res) => {
    try {
        res.status(200).send({ users: req.users });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

/*
    Rota responsável por remover um usuário de um determinado edifício baseando-se no nome
*/

router.delete('/building/:name', [auth, flow], async (req, res) => {
    try {
        if (req.user.role.match('visitor')) {
            try {
                if (req.user.visits) {
                    const visitedFloor = await Floor.findById(req.user.visits);
                    var build = await Building.findById(visitedFloor.belongsTo);
                    if (!build.name.match(req.building.name)) {
                        return res.status(400).send('You cannot get out of a building that you are not even at');
                    }
                }
                await req.user.remove();
                res.sendStatus(200);
            } catch (error) {
                return res.sendStatus(400);
            }
        }
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        req.user.visits = null;
        req.user.enters = null;
        await req.user.save();
        return res.sendStatus(200);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

/*
    Rota responsável por remover um usuário do complexo
*/

router.delete('/building', [auth, flow], async (req, res) => {
    if(req.user.role.match('visitor')){
        try {
            await req.user.remove();
            res.sendStatus(200);
        } catch(error){
            res.status(500).send({error: error.message});
        }
    } else {
        try {
            req.user.visits = null;
            req.user.enters = null;
            await req.user.save();
            res.sendStatus(200);
        } catch(error){
            res.status(500).send({error: error.message});
        }
    }
});

/*
    Rota responsável por remover um usuário de um determinado andar do edifício
*/
router.delete('/building/:name/:floor', [auth, flow], async (req, res) => {
    try {
        if(!req.user.visits){
            throw new Error('You are not even at this floor');
        }
        const visitedFloor = await Floor.findById(req.user.visits);
        if (req.floor.number !== visitedFloor.number) {
            return res.status(400).send("You cannot get out of a floor that you are not even at");
        }
        const build = await Building.findById(visitedFloor.belongsTo);
        if (!build.name.match(req.building.name)) {
            return res.status(400).send('You cannot get out of a building that you are not even at');
        }
        req.user.visits = null;
        req.user.enters = req.building._id;
        await req.user.save();
        res.sendStatus(200);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;
