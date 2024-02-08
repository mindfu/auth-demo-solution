var express = require('express');
var router = express.Router();
var multer = require('multer');
var User = require('../models/user');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var nodeMailer = require('nodemailer');
const path = require('path');
const { check, validationResult } = require('express-validator/check');
const { ensureAdminRole } = require('../middlewares/auth');
const imageFolder = 'uploads';

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imageFolder); // Set the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Set a unique filename
  },
});

const upload = multer({ storage: storage });

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function (req, res, next) {
  res.render('register', { title: 'Register' });
});

router.get('/login', function (req, res, next) {
  res.render('login', { title: 'Login' });
});

router.get('/:id/edit', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.render('editUser', { user });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to render the form for adding a new user
router.get('/new', (req, res) => {
  res.render('addUser', { user: {} });
});

router.post('/login', passport.authenticate('local', {
  failureRedirect: '/users/login',
  failureFlash: 'Invalid Credentials'
}), function (req, res) {
  req.flash('success', 'You are now logged in');
  res.redirect('/');
});

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  try {
    const user = await User.getUserById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new LocalStrategy(async function (username, password, done) {
  try {
    const user = await User.getUserByUsername(username);

    if (!user) {
      return done(null, false, { message: 'unknown user' });
    }

    const isMatch = await User.comparePassword(password, user.password);

    if (isMatch) {
      return done(null, user);
    } else {
      return done(null, false, { message: 'Invalid Password' });
    }
  } catch (err) {
    return done(err);
  }
}));

router.post('/register', upload.single('profile'), [
  check('name', 'Name is empty!! Required').not().isEmpty(),
  check('email', 'Email required').not().isEmpty(),
  check('contact', 'contact length should be 10').not().isEmpty().isLength({ max: 10 })
], async function (req, res, next) {
  var form = {
    person: req.body.name,
    email: req.body.email,
    contact: req.body.contact,
    uname: req.body.username,
    pass: req.body.password
  };

  console.log(form);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    res.render('register', { errors: errors.errors, form: form });
  } else {
    var name = req.body.name;
    var email = req.body.email;
    var uname = req.body.username;
    var password = req.body.password;
    var contact = req.body.contact;

    if (req.file) {
      var profileimage = `/${imageFolder}/${req.file.filename}`;
    } else {
      var profileimage = `/${imageFolder}/noimage.jpg`;
    }

    try {
      var newUser = new User({
        name: name,
        email: email,
        password: password,
        profileimage: profileimage,
        uname: uname,
        contact: contact,
        role: 'user' // or 'admin' based on your requirements
      });

      await User.createUser(newUser);
      console.log(newUser);

      var transporter = nodeMailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'ankurlohiya3@gmail.com',
          pass: '******'
        }
      });

      var mailOptions = {
        from: 'Deepankur Lohiya<ankurlohiya3@gmail.com>',
        to: `${email}`,
        subject: 'Confirmation Email',
        text: 'You have been successfully registered with us',
        html: `<ul><li>Name:${name}</li><li>Mobile No.:${contact}</li><li>Profile:${profileimage}</li></ul>`
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log(`Mail Sent at ${req.body.email}`);
        }
      });

      res.location('/');
      res.redirect('./login');
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  }
});

router.get('/logout', function (req, res) {
  req.logout(e => {
    if (e) {
      req.flash('error', e);
    } else {
      req.flash('success', 'You are now logged out');
      res.redirect('/users/login');
    }
  });
});

// Create a new user (only accessible to administrators)
router.post('/create', upload.single('profileimage'), [
  ensureAdminRole,
  check('name', 'Name is empty!! Required').not().isEmpty(),
  check('email', 'Email required').not().isEmpty(),
  check('contact', 'contact length should be 10').not().isEmpty().isLength({ max: 10 })
], async function (req, res, next) {
  var user = {
    email: req.body.email,
    contact: req.body.contact,
    role: req.body.role,
    profileimage: req.body.profileimage,
    name: req.body.name,
    password: req.body.password,
    uname: req.body.username,
  };

  console.log(user);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    res.render('addUser', { errors: errors.errors, user });
  } else {
    if (req.file) {
      user.profileimage = `/${imageFolder}/${req.file.filename}`;
    } else {
      user.profileimage = `/${imageFolder}/noimage.jpg`;
    }

    try {
      var newUser = new User(user);

      await User.createUser(newUser);
      console.log(newUser);
      req.flash('success', 'User created successfully!');
      res.redirect('/');
    } catch (error) {
      console.log(error);
      res.render('addUser', { errors:[error], user });
    }
  }
});

// Update an existing user (only accessible to administrators)
router.post('/update/:id', upload.single('profileimage'), [
  ensureAdminRole,
  check('name', 'Name is empty!! Required').not().isEmpty(),
  check('email', 'Email required').not().isEmpty(),
  check('contact', 'contact length should be 10').not().isEmpty().isLength({ max: 10 })
], async function (req, res) {
  var user = {
    email: req.body.email,
    contact: req.body.contact,
    role: req.body.role,
    profileimage: req.body.profileimage,
    _id: req.params.id,
    name: req.body.name
  };

  console.log(user);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    res.render('editUser', { errors: errors.errors, user: user });
  } else {
    if (req.file) {
      user.profileimage = `/${imageFolder}/${req.file.filename}`;
    }

    try {
      const updatedUser = await User.findByIdAndUpdate(req.params.id, user, { new: true });
      console.log(updatedUser);
      req.flash('success', 'User updated successfully!');
      res.redirect('/');
    } catch (error) {
      console.log(error);
      res.render('editUser', { errors:[error], user });
    }
  }
});

// Delete a user (only accessible to administrators)
router.post('/delete/:id', ensureAdminRole, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    req.flash('success', 'User deleted successfully!');
  } catch (error) {
    console.error(error);
    req.flash('error', e);
  } finally {
    res.redirect('/');
  }
});

module.exports = router;
