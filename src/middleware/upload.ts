// import multer from 'multer';
// import multerS3 from 'multer-s3';
// import { S3Client } from '@aws-sdk/client-s3';

// // ── Connect to S3 using credentials from .env 
// const s3 = new S3Client({
//   region: process.env.AWS_REGION!,
//   credentials: {
//     accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,

//     // CRITICAL: Add this for Learner Lab / AWS Academy
//     sessionToken:    process.env.AWS_SESSION_TOKEN, 
//   },
// });

// // ── S3 storage ──
// const storage = multerS3({
//   s3: s3 as any, // "as any" prevents type mismatches between SDK v3 and multer-s3
//   bucket: process.env.AWS_S3_BUCKET!,
//   // acl: 'public-read', // Added this since you want a public bucket
//   contentType: multerS3.AUTO_CONTENT_TYPE,
//   metadata: (_req, file, cb) => {
//     cb(null, { fieldName: file.fieldname });
//   },
//   key: (_req, file, cb) => {
//     const safeName  = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
//     const uniqueKey = `pulse-chat/${Date.now()}-${safeName}`;
//     cb(null, uniqueKey);
//   },
// });

// const fileFilter = (
//   _req: any, // Changed to any to avoid Express.Request type conflicts in some setups
//   file: Express.Multer.File,
//   cb: multer.FileFilterCallback
// ) => {
//   const allowed = [
//     'image/jpeg', 'image/png', 'image/gif', 'image/webp',
//     'application/pdf', 'application/msword',
//     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     'application/zip', 'video/mp4', 'video/webm',
//     'audio/mpeg', 'audio/wav', 'text/plain',
//   ];

//   if (allowed.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error(`File type not allowed: ${file.mimetype}`));
//   }
// };

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
// });

// export default upload;




import { S3Client } from '@aws-sdk/client-s3';

// S3 client — sirf yahan banao, poore backend mein import karke use karo
export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken:    process.env.AWS_SESSION_TOKEN, // Learner Lab ke liye zaroori
  },
});

// Allowed file types
export const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav',
  'text/plain',
];

export const MAX_SIZE = 10 * 1024 * 1024; // 10 MB