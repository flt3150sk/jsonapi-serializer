import ErrorUtils from "./error-utils.mjs";

const Error = (opts) => {
  if (!opts) opts = [];

  if (Array.isArray(opts)) return new ErrorUtils(opts);
  return ErrorUtils([opts]);
};

export default Error;
