// The part of an uploaded file the services use. Declared here so the code does
// not depend on the global Express.Multer typings.
export type UploadedImage = { buffer: Buffer; size: number };
