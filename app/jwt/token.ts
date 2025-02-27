import jwt from 'jsonwebtoken';
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { useRouter } from "next/navigation";
const secretKey = process.env.JWT_SECRET || 'yourFallbackSecret';

export const generateToken = (payload: any) => {
    return jwt.sign(payload, secretKey, {expiresIn: '1h'} );
};

export const verifyToken = (token: string | null) : any=> {
  try{
    if(!token) 
        return {};
    return jwt.verify(token, secretKey);
  }  catch (error) {
    console.error('Error during fetch:', error, 'token:', token);
    return {};
  }
}
