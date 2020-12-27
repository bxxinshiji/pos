const app = require('express')()
const bodyParser = require('body-parser')
const port = 3000
import Store from '@/utils/electron-store'

app.use(bodyParser.json()) // for parsing application/json

/**
 * router
 */
app.get('/', (req, res) => {
  res.send(Store.store)
})
/**
 * router
 */
var printer = require('./router/printer')
app.use('/printer', printer)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
