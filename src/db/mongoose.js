const mongoose = require('mongoose');

var mongoURL = process.env.MONGO_SRV+process.env.MONGO_ADMIN_PASSWORDgit+process.env.MONGO_URL+'/'+process.env.MONGO_DATABASE;
if(process.env.NODE_ENV === 'development'){
    mongoURL = process.env.MONGO_LOCAL_DEV;
}
console.log(mongoURL);
mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useCreateIndex: true
});

