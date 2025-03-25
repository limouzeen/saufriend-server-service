const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const userRoute = require('./routers/user.route.js'); 
const myfriendRoute = require('./routers/myfriend.route.js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: true })); // ✅ Support form data
app.use('/user', userRoute);
app.use('/myfriend', myfriendRoute);
app.use('/images', express.static('images')); 

app.get('/', (req, res) => {
    res.json({
        message : "Hello Server"
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});