import jwt from 'jsonwebtoken';
import User from '../models/User';

const signToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
};

const formatUser = (user: { _id: unknown; username: string; email: string; isOnline: boolean }) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  isOnline: user.isOnline,
});

// ── Simple validator — throws with a clear message if invalid ──
const validate = (checks: { condition: boolean; message: string }[]) => {
  for (const check of checks) {
    if (check.condition) throw new Error(check.message);
  }
};

//-------------  Register  ---------------------
export const registerUser = async (body: { username?: string; email?: string; password?: string }) => {
  const { username, email, password } = body;

  validate([
    { condition: !username,message: 'Username is required' },
    { condition: !email,message: 'Email is required' },
    { condition: !password,message: 'Password is required' },
    { condition: (username?.length ?? 0) < 3,  message: 'Username must be at least 3 characters' },
    { condition: (password?.length ?? 0) < 6,  message: 'Password must be at least 6 characters' },
    { condition: !email?.includes('@'),  message: 'Please enter a valid email' },
  ]);

  // ---------  Check duplicates  -------------------
  const emailTaken = await User.findOne({ email });
  if (emailTaken) throw new Error('Email already in use');

  const usernameTaken = await User.findOne({ username });
  if (usernameTaken) throw new Error('Username already taken');

  const user = await User.create({ username, email, password });
  const token = signToken(user._id.toString());

  return { token, user: formatUser(user) };
};

// ── Login ───
export const loginUser = async (body: { email?: string; password?: string }) => {
  const { email, password } = body;

  // Validate input first
  validate([
    { condition: !email,message: 'Email is required' },
    { condition: !password, message: 'Password is required' },
  ]);

  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid email or password');

  const isMatch = await user.comparePassword(password!);
  if (!isMatch) throw new Error('Invalid email or password');

  const token = signToken(user._id.toString());

  return { token, user: formatUser(user) };
};






// import jwt from "jsonwebtoken";
// import bcrypt from "bcrypt";
// import { db } from "../db";
// import { users } from "../db/schema/user";
// import { eq } from "drizzle-orm";

// const signToken = (userId: number): string => {
//   return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
//     expiresIn: "7d",
//   });
// };

// const formatUser = (user: any) => ({
//   id: user.id,
//   username: user.username,
//   email: user.email,
//   isOnline: user.isOnline,
// });

// // validator same as yours
// const validate = (checks: { condition: boolean; message: string }[]) => {
//   for (const check of checks) {
//     if (check.condition) throw new Error(check.message);
//   }
// };

// // ── Register ──
// export const registerUser = async (body: {
//   username?: string;
//   email?: string;
//   password?: string;
// }) => {
//   const { username, email, password } = body;

//   validate([
//     { condition: !username, message: "Username is required" },
//     { condition: !email, message: "Email is required" },
//     { condition: !password, message: "Password is required" },
//     { condition: (username?.length ?? 0) < 3, message: "Username too short" },
//     { condition: (password?.length ?? 0) < 6, message: "Password too short" },
//     { condition: !email?.includes("@"), message: "Invalid email" },
//   ]);

//   // check email
//   const existingEmail = await db
//     .select()
//     .from(users)
//     .where(eq(users.email, email!));

//   if (existingEmail.length) throw new Error("Email already in use");

//   // check username
//   const existingUsername = await db
//     .select()
//     .from(users)
//     .where(eq(users.username, username!));

//   if (existingUsername.length) throw new Error("Username already taken");

//   // hash password
//   const hashedPassword = await bcrypt.hash(password!, 10);

//   // insert
//   const result = await db.insert(users).values({
//     username,
//     email,
//     password: hashedPassword,
//   });

//   const insertedId = result[0].insertId;

//   const token = signToken(insertedId);

//   return {
//     token,
//     user: {
//       id: insertedId,
//       username,
//       email,
//       isOnline: false,
//     },
//   };
// };

// // ── Login ──
// export const loginUser = async (body: {
//   email?: string;
//   password?: string;
// }) => {
//   const { email, password } = body;

//   validate([
//     { condition: !email, message: "Email required" },
//     { condition: !password, message: "Password required" },
//   ]);

//   const result = await db
//     .select()
//     .from(users)
//     .where(eq(users.email, email!));

//   const user = result[0];

//   if (!user) throw new Error("Invalid email or password");

//   const isMatch = await bcrypt.compare(password!, user.password);
//   if (!isMatch) throw new Error("Invalid email or password");

//   const token = signToken(user.id);

//   return { token, user: formatUser(user) };
// };