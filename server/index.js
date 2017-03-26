const server = require('./app');


const PORT = process.env.PORT || 9000;

server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
