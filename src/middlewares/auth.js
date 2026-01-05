function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.sendStatus(401);
}

function requireAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.sendStatus(403);
}

module.exports = { requireAuth, requireAdmin };
