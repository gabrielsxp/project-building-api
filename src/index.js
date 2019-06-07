require('dotenv').config();

const express = require('express');
require('./db/mongoose');

const app = express();
const port = process.env.PORT || 3001; //pra poder dar deploy na Heroku

//Automaticamente converte a resposta do formato JSON para objeto.
app.use(express.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
}); 
//Endpoints
const userRouter = require('./routers/user');
const buildingRouter = require('./routers/building');

//Registrando o middleware

//Registrando as rotas
app.use(userRouter);
app.use(buildingRouter);

//loop while
app.listen(port, () => {
    console.log("Up and Running on port " + port);
});
