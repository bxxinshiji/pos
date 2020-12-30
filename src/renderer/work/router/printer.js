
var express = require('express')
var router = express.Router()
var printer = require('@/work/printer').default

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  next()
})

router.post('/accounts', (req, res) => {
  const orderInfo = req.body.orderInfo
  const username = req.body.username
  const valid = req.body.valid
  printer.accounts(orderInfo, username, valid).then((r) => {
    res.send({ valid: r })
  }).catch(err => {
    res.send({ valid: false, error: err })
  })
})

router.post('/print', (req, res) => {
  const order = req.body.order
  const cashdraw = req.body.cashdraw
  const valid = req.body.valid
  printer.hander(order, cashdraw, valid).then((r) => {
    res.send({ valid: r })
  }).catch(err => {
    res.send({ valid: false, error: err })
  })
})

router.post('/cashdraw', (req, res) => {
  printer.cashdraw().then((r) => {
    res.send({ valid: r })
  }).catch(err => {
    res.send({ valid: false, error: err })
  })
})
module.exports = router
