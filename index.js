const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0wqac.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(`${process.env.DB_COLL1}`));

app.use(fileUpload());

const port = 5000;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const carDetailCollection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_COLL1}`); 
  const makeAdminCollection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_COLL2}`);

  // for sending a packet of data from FakeData coding starts
  // app.post('/addCarDetail', (req, res) => {
  //   const car = req.body;
  //   console.log(car);
  //   carDetailCollection.insertMany(car)
  //   .then(result => {
  //     console.log("Result : ",result);
  //     console.log("result.insertedCount : ", result.insertedCount);
  //     res.send(result.insertedCount)
  //   })
  // })
  // for sending a packet of data from FakeData coding ends

  // for sending one by one document of car details with image starts from here
  app.post('/addCarDetail', (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const description = req.body.description;
    const newImg = file.data;
    const encImg = newImg.toString('base64');
    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, 'base64')
    };
    carDetailCollection.insertOne({ name, description, image })
    .then(result => {
      console.log("result.insertedCount : ", result.insertedCount);
      res.send(result.insertedCount > 0)
    })
  })
  // for sending one by one document of car details with image ends here

  // for read / loading data in client side coding starts from here
  app.get('/allCarList', (req, res) => {
    carDetailCollection.find({}).limit(20)
    .toArray( (err, documents) => {
      res.send(documents);
    })
  })
  // for read / loading data in client side coding ends here

  // for delete data from UI to server coding starts from here
  app.delete('/deleteCar/:id', (req, res) => {
    // console.log(req.params.id);
    carDetailCollection.deleteOne({_id: ObjectId(req.params.id)})
    .then( result => {
      console.log(result);
    })
  })

  // loading data for update's coding starts from here
  app.get('/loadCar/:id', (req, res) => {
    carDetailCollection.find({_id: ObjectId(req.params.id)})
    .toArray( (err, documents) => {
      res.send(documents[0]);
    } )
  })
  // loading data for update's coding ends here

  // Updating the loaded data coding starts from here
  app.patch('/updateCar/:id', (req, res) => {
    console.log(req.body.name);
    carDetailCollection.updateOne({_id: ObjectId(req.params.id)},
    {
      $set: {name: req.body.name, description: req.body.description}
    })
    .then(result => {
      console.log(result);
    })
  })

  // Sending making admin information
  app.post('/makeAdmin', (req, res) => {
    const admin = req.body;
    makeAdminCollection.insertOne(admin)
    .then(result => {
      res.send(result.insertedCount > 0)
    })
  })

  // filter admin for access sensitive area
  app.post('/getAdmin', (req, res) => {
    const email = req.body.email;
    makeAdminCollection.find({email: email})
    .toArray((error, documents) => {
       res.send(documents.length > 0);
      
    })
  })
  

});

app.get('/', (req, res) => {
  res.send('Database is connected......')
})


app.listen(process.env.PORT || port)