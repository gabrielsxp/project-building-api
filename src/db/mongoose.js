const mongoose = require('mongoose');

/*
	Código responsável por definir a string de conexão com o MongoDB
*/

var mongoURL = 'mongodb://ec2-3-219-12-16.compute-1.amazonaws.com:27017';
console.log(mongoURL);
mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useCreateIndex: true
});

