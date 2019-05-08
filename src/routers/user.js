const express = require('express');
const User = require('./../models/user');
const auth = require('./../middleware/auth');

const router = new express.Router();

//Chamadas para o modelo User
//SiGN UP
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        const token = await user.generateAuthToken();
        res.status(201).send({user , token});
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.get('/users/me', auth, async (req, res) => {
    res.status(200).send(req.user);
});


//UPDATE
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

router.patch('/super/users', auth, async (req, res) => {
    const validFields = ['role','id'];
    const fields = Object.keys(req.body);
    const isValid = fields.every((field) => validFields.includes(field));
    if(!isValid){
        return res.status(400).send('Incorrect fields');
    }
    if(!req.user.role.match('admin')){
        return res.status(401).send('You cannot patch this route');
    }
    try {
        const user = await User.findById(req.body.id);
        if(!user){
            return res.status(404).send("This user does not exists");
        }
        user.role = req.body.role;
        await user.save();
        res.status(200).send(user);
    } catch(error){
        res.status(500).send(error);
    }
});

//DELETE
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        res.sendStatus(200);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//LOGIN
router.post('/users/login', async (req, res) => {
    const fields = Object.keys(req.body);
    const requiredFields = ['email', 'password'];
    const isValid = fields.every((field) => requiredFields.includes(field));

    if (!isValid) {
        res.status(400).send({ error: 'All fields are required !' });
    }

    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        if (!user) {
            res.status(400).send({ error: 'Unable to log in' });
        }
        res.status(200).send({user , token});
    } catch (error) {
        res.sendStatus(400);
    }
});

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

module.exports = router;