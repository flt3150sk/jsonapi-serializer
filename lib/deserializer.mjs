import isFunction from "lodash/isFunction";
import DeserializerUtils from "./deserializer-utils.mjs";

const deserializer = (opts) => {
  if (!opts) opts = {};

  const deserialize = (jsonapi, callback) => {
    const collection = () => {
      return Promise.all(
        jsonapi.data.map((d) =>
          new DeserializerUtils(jsonapi, d, opts).perform()
        )
      ).then((result) => {
        if (isFunction(callback)) callback(null, result);
        return result;
      });
    };

    const resource = () => {
      return DeserializerUtils(jsonapi, jsonapi.data, opts)
        .perform()
        .then((result) => {
          if (isFunction(callback)) callback(null, result);
          return result;
        });
    };

    return Array.isArray(jsonapi.data) ? collection() : resource();
  };

  return { deserialize };
};

export default deserializer;
