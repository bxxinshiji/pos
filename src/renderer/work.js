const app = require('express')()
const bodyParser = require('body-parser')
const port = 3000

app.use(bodyParser.json()) // for parsing application/json

/**
 * router
 */
app.get('/', (req, res) => {
  res.send('123456')
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
