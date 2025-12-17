export const requireAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'ADMIN') {
        return next();
    }
    return res.status(403).json({ error: "Access denied. Admin privileges required." });
};
