import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET || 'yourFallbackSecret';

export const generateToken = (payload: any) => {
    return jwt.sign(payload, secretKey, {expiresIn: '1h'} );
};

export const verifyToken = (token: string | null) => {
  try{
    if(!token) 
        return null;
    return jwt.verify(token, secretKey);
  }  catch (error) {
    console.error('Error during fetch:', error, 'token:', token);
    return null;
  }
}
