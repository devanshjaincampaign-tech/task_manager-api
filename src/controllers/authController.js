require('dotenv').config();
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const UserModel=require('../models/userModel');

const createAccessToken=(userId,email)=>{
    return jwt.sign(
        {userId,email,type:'access'},
        process.env.JWT_ACCESS_SECRET,
        {expiresIn:process.env.JWT_ACCESS_EXPIRES || '15m'}
    );
};

const createRefreshToken=(userId)=>{
    return jwt.sign(
        {userId,type:'refresh'},
        process.env.JWT_REFRESH_SECRET,
        {expiresIn:process.env.JWT_REFRESH_EXPIRES || '7d'}
    );
};

const register = async(req,res)=>{
    try{
        const{name,email,password}=req.body;

        if(!name||!email||!password){
            return res.status(400).json({
                error:'Validation falied',
                message:'name,email,and password are required'
            });
        }

        if(password.length<8){
            return res.status(400).json({
                error:'Validation Failed',
                message:'Password must be of atleast 8 characters'
            });
        }

        const taken=await UserModel.emailExists(email.toLowerCase().trim());

        if(!taken){
            return res.status(409).json({
                error:'Conflict',
                message:'An account with this email already exists'
            });
        }

        const rounds=parseInt(process.env.BCRYPT_ROUNDS)||12;
        const hashedPassword=await bcrypt.hash(password,round);

        const user=await UserModel.create(
            name.trim(),
            email.toLowerCase().trim(),
            hashedPassword
        );


        const accessToken=createAccessToken(user.id,user.email);
        const refreshToken=createRefreshToken(user.id);

        await UserModel.saveRefreshToken(user.id,refreshToken);

        res.status(201).json({
            message:'Account created successfully',
            user:{
                id:user.id,
                name:user.name,
                email:user.email,
                createdAt:user.created_at
            },
            tokens:{accessToken,refreshToken,accessExpiresIn:'15 minutes'}
        });
    }
    catch(err){
        console.error('Register error:',err.message);
        res.status(500).json({error:'Registration failed'});
    }
};


const login=async(req,res)=>{
    try{
        const{email,password}=req.body;
        if(!email||!password){
            return res.status(400).json({
                error:'Validation Failed',
                message:'email and password are require'
            });
        }

        const user=await UserModel.findByEmail(email.toLowerCase().trim());

        if(!user){
            return res.status(400).json({
                error:'Invalid credential',
                message:'Email or password is incorrect'
            });
        }

        const match=await bcrypt.compare(password,user.password);

        if(!match){
            return res.status(401).json({
                error:'Invalid Credentials',
                message:'Email or password is incorrect'
            });
        }

        const accessToken=createAccessToken(user.id,user.email);
        const refreshToken=createRefreshToken(user.id);

        await UserModel.saveRefreshToken(user.id,refreshToken);

        res.status(200).json({
            message:'login successful',
            user:{id:user.id,name:user.name,email:user.email},
            tokens:{accessToken,refreshToken,accessExpiresIn:'15 minutes'}
        });
    }
    catch(err){
        console.error('login error:',err.message);
        res.status(500).json({error:'Login Failed'});
    }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        error:   'Bad Request',
        message: 'Refresh token is required'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({
        error:   'Invalid Token',
        message: 'Refresh token is invalid or expired'
      });
    }

    const stored = await UserModel.findRefreshToken(token, decoded.userId);
    if (!stored) {
      return res.status(401).json({
        error:   'Invalid Token',
        message: 'Refresh token not found. Please log in again.'
      });
    }

    const user           = await UserModel.findById(decoded.userId);
    const newAccessToken = createAccessToken(user.id, user.email);

    res.status(200).json({
      message:         'Token refreshed',
      accessToken:     newAccessToken,
      accessExpiresIn: '15 minutes'
    });

  } catch (err) {
    console.error('Refresh error:', err.message);
    res.status(500).json({ error: 'Could not refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        error:   'Bad Request',
        message: 'Refresh token is required'
      });
    }

    await UserModel.deleteRefreshToken(token);
    res.status(200).json({ message: 'Logged out successfully' });

  } catch (err) {
    console.error('Logout error:', err.message);
    res.status(500).json({ error: 'Logout failed' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ error: 'Could not fetch profile' });
  }
};

module.exports = { register, login, refresh, logout, getMe };