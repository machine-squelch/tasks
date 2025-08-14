// Enterprise Authentication Middleware
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class AuthenticationManager {
    constructor() {
        this.JWT_SECRET = process.env.JWT_SECRET || 'dluxe-sales-secure-secret-2025';
        this.JWT_EXPIRES_IN = '24h';
        this.saltRounds = 12;
    }

    // JWT Token generation
    generateToken(user) {
        return jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role,
                permissions: user.permissions || []
            },
            this.JWT_SECRET,
            { 
                expiresIn: this.JWT_EXPIRES_IN,
                issuer: 'dluxe-sales-system',
                audience: 'dluxe-sales-users'
            }
        );
    }

    // Token verification middleware
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                error: 'Access denied - No token provided',
                code: 'NO_TOKEN'
            });
        }

        jwt.verify(token, this.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ 
                    error: 'Invalid or expired token',
                    code: 'INVALID_TOKEN'
                });
            }
            
            req.user = decoded;
            next();
        });
    }

    // Role-based authorization
    requireRole(roles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            if (!roles.includes(req.user.role)) {
                return res.status(403).json({ 
                    error: 'Insufficient permissions',
                    required: roles,
                    current: req.user.role
                });
            }

            next();
        };
    }

    // Password hashing
    async hashPassword(password) {
        return bcrypt.hash(password, this.saltRounds);
    }

    // Password verification
    async verifyPassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }

    // Session refresh
    refreshToken(oldToken) {
        try {
            const decoded = jwt.verify(oldToken, this.JWT_SECRET, { ignoreExpiration: true });
            return this.generateToken(decoded);
        } catch (error) {
            throw new Error('Invalid token for refresh');
        }
    }
}

// Rate limiting for auth endpoints
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many authentication attempts',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    AuthenticationManager,
    authLimiter
};