const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
require('dotenv').config()

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors()); // WTF CORS

let dbUrl = process.env.MONGO_URL;

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

let urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number }
})
//schema for response object 

let urlObj = mongoose.model('urlObj', urlSchema);

let responseObj = {}
// empty response object to be filled in later with

let REGEX = /^[http://www.]/gi
// should use DNS lookup but FCC test doesn't like that method of validation


app.use('/public', express.static(`${process.cwd()}/public`));

app.use(cors());

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//post request - Question 2 

app.post('/api/shorturl', bodyParser.urlencoded({ extended: false }), (req, res) => {
  let url = '';
  let shorterURL = 1;

  if (REGEX.test(req.body.url)) {
    console.log("URL IS:" + req.body.url)
    url = req.body.url;
  }
// evals to true is matches regex 

  else {
    return res.json({ error: 'invalid url' })
  } // pass TEST #4

  responseObj['original_url'] = url;

  urlObj.findOne({}).sort({ short_url: 'desc' }).exec((error, result) => {
    if (!error && result != null) {
      shorterURL = result.short_url + 1
    }
    if (!error) {
      urlObj.findOneAndUpdate({ original_url: url },
        { original_url: url, short_url: shorterURL },
        { new: true, upsert: true },
        (err, savedURL) => {
          if (!err) {
            responseObj['short_url'] = savedURL.short_url
            console.log("SHORT URL IS: " + responseObj.short_url)
            return res.json(responseObj);
          }
          else {
            console.log(err)
          }
        })
    }
    else {
      console.log(error);
    }
  })
})

app.get('/api/shorturl/:urlId', bodyParser.urlencoded({ extended: false }), (req, res) => {

  var id = req.params.urlId

  urlObj.findOne({ short_url: id }, (err, data) => {
    if (!err && data != null) {
      console.log("ORIGINAL URL IS: " + data.original_url)
      return res.redirect(data.original_url);
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

