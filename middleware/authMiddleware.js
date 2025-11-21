import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ 
                message: 'Unauthorized', 
                error: 'No token provided or invalid format' 
            });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();

    } catch (error) {
        console.error("JWT Error:", error.message);
        return res.status(401).json({ message: 'Unauthorized', error: error.message });
    }
};
