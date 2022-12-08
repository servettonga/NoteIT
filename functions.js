import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config()


// Token verification -------------------------------------------------------------
export async function verifyToken(req, res, next) {
    const token = req.body.token || req.query.token || req.headers['x-access-token'] || req.cookies['x-access-token'];

    if (!token) {
        return res.status(403).redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);
        req.user = decoded;
    } catch (err) {
        return res.status(401).redirect('/login')
    }
};


// Manage cookies ----------------------------------------------------------------
const expire = new Date(Date.now() + 1 * 3600000) // cookie will be removed after 1 hour

export function createCookies(res, existingUser) {
    return res
        .status(201)
        .cookie('x-access-token', existingUser.token, {
            expires: expire
        })
        .cookie('loggedin', true, {
            expires: expire
        })
        .cookie('username', existingUser.email)
        .redirect(301, '/notes')
};

export function extendCookies(req, res) {
    return res
        .cookie('x-access-token', req.cookies['x-access-token'], {
            expires: expire
        })
        .cookie('loggedin', true, {
            expires: expire
        })
        .cookie('username', req.cookies.username)
};

export function clearCookies(res) {
    res
        .clearCookie('x-access-token', 'loggedin', 'userid')
        .clearCookie('loggedin')
        .redirect('/login')
};