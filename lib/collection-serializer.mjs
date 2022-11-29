import SerializerUtils from "./serializer-utils";

const CollectionSerializer = (payload, collectionName, records, opts) => {
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

export default CollectionSerializer;
