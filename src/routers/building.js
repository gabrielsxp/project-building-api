const express = require('express');
const auth = require('../middleware/auth');
const flow = require('../middleware/flow');
const Building = require('../models/building');
const Floor = require('../models/floor');
const User = require('../models/user');
const router = express.Router();

router.post('/building', async (req, res) => {
    const body = req.body;
    const requiredFields = ['name', 'capacity', 'numberOfFloors'];
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
                return res.status(400).send('You cannot visit two buildings at the same time !');
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



router.post('/building/:name/:floor', [auth, flow], async (req, res) => {
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
        const floor = req.floor;
        const checkLotation = await floor.verifyLotation(req.user.role);
        const allowsAccess = floor.allowsAccess(req.user.role);

        if (!allowsAccess) {
            return res.status(401).send('You don\'t have access level to enter this floor !');
        }
        if (!checkLotation) {
            return res.status(401).send('Floor with maximum capacity. Come back later');
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
        res.status(500).send({ error: error.message });
    }
});

router.patch('/building/:name/:floor', [auth, flow], async (req, res) => {
    if(!req.user.role.match('admin')){
        return res.status(400).send('You are not allowed to patch this url');
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

router.get('/building/:name', flow, async (req, res) => {
    const building = req.building;
    try {
        var countUsers = 0;
        await building.populate('users').execPopulate();
        for (const floor of building.floors) {
            await floor.populate('users').execPopulate();
            countUsers += floor.users;
        }
        countUsers += building.users;
        res.status(200).send({ users: countUsers });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.delete('/building/:name', [auth, flow], async (req, res) => {
    try {
        if (req.user.role.match('visitor')) {
            try {
                if (req.user.visits) {
                    const visitedFloor = await Floor.findById(req.user.visits);
                    var build = await Building.findById(visitedFloor.belongsTo);
                    console.log(build);
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
        var build = await Building.findById(req.user.enters);
        if (!build.name.match(req.building.name)) {
            return res.status(400).send('You cannot get out of a building that you are not even at');
        }
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        req.user.visits = null;
        req.user.enters = null;
        await req.user.save();
        res.sendStatus(200);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

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
