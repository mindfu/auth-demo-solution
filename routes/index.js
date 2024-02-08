var express = require('express');
var perf = require('execution-time-async')();
var router = express.Router();
perf.config();
const { ensureAuthenticated } = require('../middlewares/auth');
const User = require('../models/user');

/* GET home page . */
router.get('/', ensureAuthenticated, async function (req, res, next) {
  const isAdmin = req.user.role === 'admin';
  const users = await User.find().select('-password');
  console.log(users)
  res.render('index', { title: 'Members', isAdmin, users });
});

module.exports = router;
