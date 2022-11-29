import isFunction from "lodash/isFunction";
import _mapValues from "lodash/mapValues";
import SerializerUtils from "./serializer-utils.mjs";

const serializer = (collectionName, records, opts = records) => {
  const serialize = (records) => {
    const payload = {};

    const getLinks = (links) =>
      _mapValues(links, (value) =>
        isFunction(value) ? value(records) : value
      );

    const collection = () => {
      payload.data = [];

      records.forEach((record) => {
        const serializerUtils = SerializerUtils(
          collectionName,
          record,
          payload,
          opts
        );
        payload.data.push(serializerUtils.perform());
      });

      return payload;
    };

    const resource = () => {
      payload.data = new SerializerUtils(
        collectionName,
        records,
        payload,
        opts
      ).perform(records);

      return payload;
    };

    if (opts.topLevelLinks) payload.links = getLinks(opts.topLevelLinks);

    if (opts.meta)
      payload.meta = _mapValues(opts.meta, (value) =>
        isFunction(value) ? value(records) : value
      );

    return Array.isArray(records) ? collection(records) : resource(records);
  };

  return { serialize };
};

export default serializer;
