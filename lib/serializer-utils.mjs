import isPlainObject from "lodash-es/isPlainObject";
import isFunction from "lodash-es/isFunction";
import _find from "lodash-es/find";
import _merge from "lodash-es/merge";
import _identity from "lodash-es/identity";
import _transform from "lodash-es/transform";
import _mapValues from "lodash-es/mapValues";
import _mapKeys from "lodash-es/mapKeys";
import _pick from "lodash-es/pick";
import _pickBy from "lodash-es/pickBy";
import _each from "lodash-es/each";
import _isNil from "lodash-es/isNil";
import Inflector from "./inflector.mjs";

const serializerUtils = (collectionName, record, payload, opts) => {
  const isComplexType = (obj) => Array.isArray(obj) || isPlainObject(obj);

  const keyForAttribute = (attribute) => {
    if (isPlainObject(attribute)) {
      return _transform(attribute, (result, value, key) => {
        if (isComplexType(value)) {
          result[keyForAttribute(key)] = keyForAttribute(value);
        } else {
          result[keyForAttribute(key)] = value;
        }
      });
    }

    if (Array.isArray(attribute)) {
      return attribute.map((attr) =>
        isComplexType(attr) ? keyForAttribute(attr) : attr
      );
    }

    return isFunction(opts.keyForAttribute)
      ? opts.keyForAttribute(attribute)
      : Inflector.caserize(attribute, opts);
  };

  const getId = () => opts.id || "id";

  const getRef = (current, item, opts) => {
    if (isFunction(opts.ref)) return opts.ref(current, item);
    if (opts.ref === true) {
      return Array.isArray(item)
        ? item.map((val) => String(val))
        : String(item);
    }
    if (item && item[opts.ref]) return String(item[opts.ref]);
  };

  const getType = (str, attrVal) => {
    let type;
    attrVal = attrVal || {};

    if (isFunction(opts.typeForAttribute)) {
      type = opts.typeForAttribute(str, attrVal);
    }

    // If the pluralize option is on, typeForAttribute returned undefined or wasn't used
    if (
      (opts.pluralizeType === undefined || opts.pluralizeType) &&
      type === undefined
    ) {
      type = Inflector.pluralize(str);
    }

    if (type === undefined) {
      type = str;
    }

    return type;
  };

  const getLinks = (current, links, dest) => {
    return _mapValues(links, (value) => {
      isFunction(value) ? value(record, current, dest) : value;
    });
  };

  const getMeta = (current, meta) => {
    if (isFunction(meta)) return meta(record);

    return _mapValues(meta, (value) => {
      isFunction(value) ? value(record, current) : value;
    });
  };

  const pick = (obj, attributes) => {
    return _mapKeys(_pick(obj, attributes), (value, key) =>
      keyForAttribute(key)
    );
  };

  const isCompoundDocumentIncluded = (_included, item) => {
    return _find(payload.included, { id: item.id, type: item.type });
  };

  const pushToIncluded = (dest, include) => {
    const included = isCompoundDocumentIncluded(dest, include);
    if (included) {
      // Merge relationships
      included.relationships = _merge(
        included.relationships,
        _pickBy(include.relationships, _identity)
      );

      // Merge attributes
      included.attributes = _merge(
        included.attributes,
        _pickBy(include.attributes, _identity)
      );
    } else {
      if (!dest.included) {
        dest.included = [];
      }
      dest.included.push(include);
    }
  };

  const serialize = (dest, current, attribute, opts) => {
    let data = null;

    if (opts && opts.ref) {
      if (!dest.relationships) dest.relationships = {};

      if (Array.isArray(current[attribute])) {
        data = current[attribute].map((item) =>
          serializeRef(item, current, attribute, opts)
        );
      } else {
        data = serializeRef(current[attribute], current, attribute, opts);
      }

      dest.relationships[keyForAttribute(attribute)] = {};
      if (!opts.ignoreRelationshipData) {
        dest.relationships[keyForAttribute(attribute)].data = data;
      }

      if (opts.relationshipLinks) {
        const links = getLinks(
          current[attribute],
          opts.relationshipLinks,
          dest
        );
        if (links.related)
          dest.relationships[keyForAttribute(attribute)].links = links;
      }

      if (opts.relationshipMeta) {
        dest.relationships[keyForAttribute(attribute)].meta = getMeta(
          current[attribute],
          opts.relationshipMeta
        );
      }
    } else {
      if (Array.isArray(current[attribute])) {
        if (current[attribute].length && isPlainObject(current[attribute][0])) {
          data = current[attribute].map((item) =>
            serializeNested(item, current, attribute, opts)
          );
        } else {
          data = current[attribute];
        }
        dest.attributes[keyForAttribute(attribute)] = data;
      } else if (isPlainObject(current[attribute])) {
        data = serializeNested(current[attribute], current, attribute, opts);
        dest.attributes[keyForAttribute(attribute)] = data;
      } else {
        dest.attributes[keyForAttribute(attribute)] = current[attribute];
      }
    }
  };

  const serializeRef = (dest, current, attribute, opts) => {
    const id = getRef(current, dest, opts);
    const type = getType(attribute, dest);

    const relationships = [];
    const includedAttrs = [];

    if (opts.attributes) {
      if (dest) {
        opts.attributes.forEach((attr) => {
          if (opts[attr] && !dest[attr] && opts[attr].nullIfMissing) {
            dest[attr] = null;
          }
        });
      }
      relationships = opts.attributes.filter((attr) => opts[attr]);
      includedAttrs = opts.attributes.filter((attr) => !opts[attr]);
    }

    const included = { type: type, id: id };
    if (includedAttrs) included.attributes = pick(dest, includedAttrs);

    relationships.forEach((relationship) => {
      if (
        dest &&
        (isComplexType(dest[relationship]) || dest[relationship] === null)
      ) {
        serialize(included, dest, relationship, opts[relationship]);
      }
    });

    if (
      includedAttrs.length &&
      (opts.included === undefined || opts.included)
    ) {
      if (opts.includedLinks)
        included.links = getLinks(dest, opts.includedLinks);

      if (typeof id !== "undefined") pushToIncluded(payload, included);
    }

    return typeof id !== "undefined" ? { type: type, id: id } : null;
  };

  const serializeNested = (dest, _current, _attribute, opts) => {
    const embeds = [];
    const attributes = [];
    const ret = {};

    if (opts && opts.attributes) {
      embeds = opts.attributes.filter((attr) => opts[attr]);
      attributes = opts.attributes.filter((attr) => !opts[attr]);

      if (attributes) ret.attributes = pick(dest, attributes);

      embeds.forEach((embed) => {
        if (isComplexType(dest[embed])) {
          serialize(ret, dest, embed, opts[embed]);
        }
      });
    } else {
      ret.attributes = dest;
    }

    return ret.attributes;
  };

  const perform = () => {
    if (record === null) return null;

    // If option is present, transform record
    if (opts && opts.transform) record = opts.transform(record);

    // Top-level data.
    const data = { type: getType(collectionName, record) };
    if (!_isNil(record[getId()])) data.id = String(record[getId()]);

    // Data links.
    if (opts.dataLinks) data.links = getLinks(record, opts.dataLinks);

    // Data meta
    if (opts.dataMeta) data.meta = getMeta(record, opts.dataMeta);

    _each(opts.attributes, (attribute) => {
      const splittedAttributes = attribute.split(":");

      if (
        opts[attribute] &&
        !record[attribute] &&
        opts[attribute].nullIfMissing
      ) {
        record[attribute] = null;
      }

      if (splittedAttributes[0] in record) {
        if (!data.attributes) data.attributes = {};

        let attributeMap = attribute;
        if (splittedAttributes.length > 1) {
          attribute = splittedAttributes[0];
          attributeMap = splittedAttributes[1];
        }

        serialize(data, record, attribute, opts[attributeMap]);
      }
    });

    return data;
  };

  return { serialize, serializeRef, serializeNested, perform };
};

export default serializerUtils;
