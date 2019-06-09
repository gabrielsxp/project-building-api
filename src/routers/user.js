const express = require('express');
const User = require('./../models/user');
const Floor = require('./../models/floor');
const auth = require('./../middleware/auth');
const control = require('./../middleware/control');
const router = new express.Router();

/*
    Rota responsável por criar um usuário e não adicioná-lo a qualquer edifício
*/
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        const token = await user.generateAuthToken();
        res.status(201).send({user , token});
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

/*
    Rota responsável por retornar os dados de um usuário
*/

router.get('/users/me', auth, async (req, res) => {
    res.status(200).send(req.user);
});

router.patch('/super/me', auth, async (req, res) => {
    const user = req.user;
    try {
        user.role = 'admin';
        await user.save();
        res.sendStatus(200);
    }
    catch(error){
        res.status(500).send({error: error.message});
    }
})


/*
    Rota responsável por atualizar as informações de um usuário
*/
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const validUpdates = ['name', 'password', 'email', 'age'];
    const isValidUpdate = updates.every((update) => validUpdates.includes(update));

    if (!isValidUpdate) {
        return res.status(400).send({ error: 'Invalid Updates !' });
    }

    try {
        const user = await User.findById(req.user._id);
        updates.forEach((update) => user[update] = req.body[update]);
        await user.save();
        res.status(201).send(user);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
})
/*
    Rota responsável por atualizar as informações de qualquer usuário
*/
router.patch('/super/users', auth, async (req, res) => {
    const validFields = ['role','id'];
    const fields = Object.keys(req.body);
    const isValid = fields.every((field) => validFields.includes(field));
    if(!isValid){
        return res.status(400).send({error: 'Campos incorretos'});
    }
    if(!req.user.role.match('admin')){
        return res.status(401).send({error: 'Você não pode alterar esses dados'});
    }
    try {
        const user = await User.findById(req.body.id);
        if(!user){
            return res.status(404).send({error: 'Esse usuário não existe'});
        }
        user.role = req.body.role;
        await user.save();
        res.status(200).send(user);
    } catch(error){
        res.status(500).send({error: error.message});
    }
});

/*
    Rota responsável por remover um usuário
*/
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        res.sendStatus(200);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

/*
    Rota responsável por remover todos os usuários
*/
router.delete('/users', async (req, res) => {
    try {
        await User.deleteMany({});
        res.sendStatus(200);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

/*
    Rota responsável por autenticar um usuário
*/
router.post('/users/login', async (req, res) => {
    const fields = Object.keys(req.body);
    const requiredFields = ['email', 'password'];
    const isValid = fields.every((field) => requiredFields.includes(field));

    if (!isValid) {
        res.status(400).send({ error: 'Todos os campos são requeridos' });
    }

    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        if (!user) {
            res.status(400).send({ error: 'Problema ao autenticar usuário' });
        }
        res.status(200).send({user , token});
    } catch (error) {
        res.sendStatus(400);
    }
});


/*
    Rota responsável por deslogar um usuário
*/
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.sendStatus(200);
    } catch(error){
        res.status(500).send({error: error.message});
    }
});

/*
    Rota responsável por criar aleatóriamente, diversos usuários e adicioná-los a prédios distintos.
    Se não for possível adicionar um usuário, o próximo usuário será adicionado
*/
router.post('/users/random', control, async (req, res) => {
    const buildings = req.buildings;
    const qtd = req.body.numberOfPeople;
    try {
        var success = 0;
        for(let i = 0; i < qtd; i++){
            const name = Math.random().toString(36).substr(2, 9);
            const email = name+'@email.com';
            const building = buildings[Math.floor(Math.random()*buildings.length)];
            var floor = building.floors[Math.floor(Math.random()*building.floors.length)];
            const f = await Floor.findById(floor);
            const isFull = await f.isFull();
            if(!isFull){
                const user = new User({
                name: name,
                email: email,
                enters: null,
                visits: floor._id
                });
                await user.save();
                success++;
            }
        }
        res.status(201).send({ success });
    } catch(error){
        res.status(500).send({error: error.message});
    }
});

module.exports = router;