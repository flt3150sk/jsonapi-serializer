import serializer from "./lib/serializer";
import deserializer from "./lib/deserializer";
import error from "./lib/error.mjs";

export default {
  Serializer: serializer,
  Deserializer: deserializer,
  Error: error,
};
