const mongoose = require('mongoose');

/*
	Código responsável por definir a string de conexão com o MongoDB
*/

var mongoURL = 'mongodb://ec2-54-158-82-184.compute-1.amazonaws.com:27017/building-complex-api';
console.log(mongoURL);
mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useCreateIndex: true
});

