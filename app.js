require('dotenv').config();

const express = require('express');

const config = {
  dirname: __dirname,
  name: process.env.NAME,
  title: process.env.NAME_READABLE,
  http: {
    port: process.env.PORT,
  },
};

const app = express();

app.set('view engine', 'pug');
app.set('views', './views');

app.use('/assets', express.static(config.dirname + '/public/assets/'));
app.use(express.static(config.dirname + '/public/'));

app.use((req, res, next) => {
  res.locals.title = config.title;
  res.locals.name = config.name;
  return next();
});
app.get('/', (req, res) => {
  return res.render('home');
});
app.get('/aws-config', (req, res) => {
  const config = {
    region: process.env.AWS_REGION,
    identity: process.env.AWS_IDENTITY,
    bucketName: process.env.AWS_BUCKETNAME,
  };
  return res.send(config);
});

app.listen(config.http.port);
console.log('%s started on %s | port:%d', config.name, new Date(Date.now()).toISOString(), config.http.port);
