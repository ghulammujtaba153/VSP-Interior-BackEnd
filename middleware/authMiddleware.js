import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers && req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: 'Unauthorized',
                error: 'No token provided or invalid format'
            });
        }

        let token = authHeader.split(' ')[1] || '';
        token = String(token).trim();

        if (!token || token === 'null' || token === 'undefined') {
            return res.status(401).json({
                message: 'Unauthorized',
                error: 'Empty token provided'
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT secret is not set in environment');
            return res.status(500).json({ message: 'Server error', error: 'JWT secret not configured' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (verifyErr) {
            // Mask token preview when logging (do not print full token)
            const safePreview = token && token.length ? `${token.slice(0, 10)}... (len=${token.length})` : 'n/a';
            console.error('JWT verify error:', verifyErr.message, 'token preview:', safePreview);
            return res.status(401).json({ message: 'Unauthorized', error: verifyErr.message });
        }

        req.user = decoded;
        next();

    } catch (error) {
        console.error("JWT Error:", error && error.message ? error.message : error);
        return res.status(401).json({ message: 'Unauthorized', error: (error && error.message) || 'jwt error' });
    }
};
