function ensureAuthenticated(req,res,next){
    if(req.isAuthenticated()){
      return next();
    }
    res.redirect('/users/login')
  }

function ensureAdminRole(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Permission Denied' });
    }
}

module.exports = {
    ensureAuthenticated,
    ensureAdminRole
}