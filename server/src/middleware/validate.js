import { ApiError } from '../utils/ApiError.js';

const toDetails = (issues) =>
  issues.map((issue) => ({
    field: issue.path.length ? issue.path.join('.') : '(body)',
    message: issue.message,
  }));

export const validate = (schemas) => (req, _res, next) => {
  req.validated = {};
  const details = [];

  for (const part of ['body', 'query']) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (result.success) req.validated[part] = result.data;
    else details.push(...toDetails(result.error.issues));
  }

  if (details.length) return next(ApiError.badRequest('Validation failed', details));
  next();
};
