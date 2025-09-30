import express from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './models/users.js';
import RefreshToken from './models/refreshTokens.js';
import { v4 as uuidv4 } from 'uuid';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';

dotenv.config();
const app = express();
const port = 5000;
const saltRounds = 10;
const connectionString = process.env.MONGO_CONNECTION_STRING;
const accessTokenSecretKey = process.env.ACCESS_TOKEN_SECRET_KEY;
const refreshTokenSecretKey = process.env.REFRESH_TOKEN_SECRET_KEY;
const accessTokenExpiryTime = 900000; // 15 minutes
const refreshTokenExpiryTime = 2.628e+9; // 1 month

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(cookieParser());

mongoose.connect(connectionString)
    .then(() => {
        console.log('Successfully connected to the database')
    })
    .catch(err => {
        console.log('Error connecting to the database', err);
    });

// Middleware
const checkAuth0Jwt = auth({
	audience: 'http://localhost:5000',
	issuerBaseURL: 'https://dev-jco6fy6pebxlsglc.us.auth0.com/',
	tokenSigningAlg: 'RS256'
});

// Middleware
// Denies access to requests with invalid/expired access tokens
// If access token is expired, a token expired error is sent to the client, which will then call the /refresh route
const checkAccessToken = async (req, res, next) => {
	const { accessToken } = req.cookies;

	if (!accessToken) {
		return res.status(401).json({ error: "Access token invalid" }); // Unauthorised
	};

	try {
		const payload = jwt.verify(accessToken, accessTokenSecretKey);
		req.user = payload;
		next();

	} catch (err) {
		if (err.name === 'TokenExpiredError') return res.status(401).json({ error: err.name }); // Unauthorised
		else return res.status(401).json({ error: err.name });
	};
};


const getUser = async ({ username=null, uid=null } = {}) => {
	try {
		if (username) {
			return await User.findOne({ username: username });
		} else if (uid) {
			return await User.findOne({ _id: uid });
		};
	} catch (err) {
		console.error('Error retrieving user');
	};
};

const createAccessToken = (user, secretKey=accessTokenSecretKey, expireTime=accessTokenExpiryTime) => {
	const accessTokenPayload = { 
		uid: user._id, 
		username: user.username,
	};

	return jwt.sign(accessTokenPayload, secretKey, { expiresIn: expireTime });
};

const createRefreshToken = (tokenId, user, secretKey=refreshTokenSecretKey, expireTime=refreshTokenExpiryTime) => {
	const refreshTokenPayload = { 
		tokenId: tokenId,
		uid: user._id, 
	};

	return jwt.sign(refreshTokenPayload, secretKey, { expiresIn: expireTime });
};

const getRefreshTokenData = async (tokenId) => {
	try {
		// Get refresh token data from db
		const refreshTokenData = await RefreshToken.findOne({ tokenId: tokenId, revoked: false });

		if (!refreshTokenData) return null;

		return refreshTokenData;
		
	} catch (err) {
		console.error(err);
		return null;
	};
};

const rotateRefreshToken = async (oldRefreshTokenId, user) => {
	try {
		const newTokenId = uuidv4();
		const newRefreshToken = createRefreshToken(newTokenId, user);

		// Overwrite the old refresh token with the new one
		await RefreshToken.updateOne(
			{ tokenId: oldRefreshTokenId, uid: user.uid },
			{ tokenId: newTokenId }
		);

		return newRefreshToken;

	} catch (err) {
		return null;
	};
};

app.post('/refresh', async (req, res) => {
	const { refreshToken } = req.cookies;

	if (!refreshToken) {
		return res.sendStatus(401);
	};

	try {
		// Verify that client refresh token is not malformed or expired
		const clientRefreshToken = jwt.verify(refreshToken, refreshTokenSecretKey);
		
		// Get refresh token data from db via helper
		const refreshTokenData = await getRefreshTokenData(clientRefreshToken.tokenId);
		
		// If the refresh token invalidated or there was a retrieval error return unauthorised
		if (!refreshTokenData) return res.sendStatus(401);
		
		// Create new access token
		const user = await getUser({ uid: refreshTokenData.uid })
		const accessToken = createAccessToken(user);
		
		// Attach to client as cookie
		res.cookie("accessToken", accessToken, {
			maxAge: accessTokenExpiryTime,
			httpOnly: true,
		});

		// Rotate refresh token
		const oldRefreshTokenId = refreshTokenData.tokenId
		const refreshToken = await rotateRefreshToken(oldRefreshTokenId, user)
		
		// Attach to client as cookie
		res.cookie("refreshToken", refreshToken, {
			maxAge: refreshTokenExpiryTime,
			httpOnly: true,
		});

		return res.status(200).json({ message: "Access token successfully refreshed"});

	} catch (err) {
		// Client refresh token is malformed or has expired
		return res.sendStatus(401); // Unauthorised
	};
});

app.post('/login', async (req, res) => {
	const { username, password } = req.body;

	const user = await getUser({ username: username });

	if (!user) return res.status(401).send("Invalid username or password"); // Unauthorised

	const match = await bcrypt.compare(password, user.passwordHash);

	if (!match) return res.status(401).send("Invalid username or password"); // Unauthorised

	// Create refresh token
	const tokenId = uuidv4();
	const refreshToken = createRefreshToken(tokenId, user);
	
	// Store refresh token in DB
	await RefreshToken.create({ tokenId: tokenId, uid: user._id });

	// Set refresh token as cookie
	res.cookie("refreshToken", refreshToken, {
		maxAge: refreshTokenExpiryTime,
		httpOnly: true,
	});

	// Create access token and set as cookie
	const accessToken = createAccessToken(user);

	res.cookie("accessToken", accessToken, {
		maxAge: accessTokenExpiryTime,
		httpOnly: true,
	});

	return res.status(200).send("Login successful");
});

app.post("/logout", async (req, res) => {
	const { refreshToken } = req.cookies;

	if (refreshToken) {
		try {
			const decoded = jwt.verify(refreshToken, refreshTokenSecretKey);
			// Revoke refresh token in DB
			await RefreshToken.updateOne({ tokenId: decoded.tokenId }, { $set: { revoked: true } });

		} catch (err) {
			console.error("Error revoking refresh token:", err.message);
		};
	};

	// Clear cookies regardless
	res.clearCookie("accessToken");
	res.clearCookie("refreshToken");

	return res.sendStatus(200);
});

app.post('/register', async (req, res) => {
	const { username, password } = req.body;

	const user = await getUser({ username: username });

	if (user) return res.status(409).send('Username taken'); // conflict
	
	const passwordHash = await bcrypt.hash(password, saltRounds);

	try {
		await User.create({ 
			username: username,
			passwordHash: passwordHash, 
		});

		return res.sendStatus(200);
	} catch (err) {
		console.error("Error registering user");
		return res.sendStatus(500); // Internal server error
	};
});

app.get('/api/me', checkAccessToken, (req, res) => {
	return res.json(req.user);
});

app.post('/predict', checkAccessToken, (req, res) => {

});

app.post('/train', checkAccessToken, (req ,res) => [

]);

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});