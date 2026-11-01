import { saveUpload } from '../uploads';

type Cb = (err: Error | null, value?: any) => void;
interface Options {
  storage?: { filename?: (req: any, file: any, cb: Cb) => void };
  fileFilter?: (req: any, file: any, cb: Cb) => void;
  limits?: { fileSize?: number };
}

/** Browser stand-in for multer: pulls the file out of the request's FormData and keeps it in the demo upload store. */
function multer(options: Options = {}) {
  return {
    single(field: string) {
      return async (req: any, res: any, next: () => void) => {
        const blob = req.formData?.get(field);
        if (!(blob instanceof File)) return next();

        const file: any = { fieldname: field, originalname: blob.name, mimetype: blob.type, size: blob.size };
        const fail = (message: string) => res.status(500).send({ ok: false, message });

        if (options.limits?.fileSize && blob.size > options.limits.fileSize) return fail('File too large');
        if (options.fileFilter) {
          const err = await new Promise<Error | null>((resolve) =>
            options.fileFilter!(req, file, (e) => resolve(e)));
          if (err) return fail(err.message);
        }
        file.filename = await new Promise<string>((resolve) => {
          if (options.storage?.filename) options.storage.filename(req, file, (_e, name) => resolve(name));
          else resolve(`${field}-${Date.now()}`);
        });
        await saveUpload(file.filename, blob);
        req.file = file;
        next();
      };
    },
  };
}
multer.diskStorage = (opts: unknown) => opts;
export default multer;
