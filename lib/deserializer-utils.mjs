import isPlainObject from "lodash-es/isPlainObject";
import isFunction from "lodash-es/isFunction";
import _find from "lodash-es/find";
import _extend from "lodash-es/extend";
import _transform from "lodash-es/transform";
import Inflector from "./inflector.mjs";

const deserializerUtils = (jsonapi, data, opts) => {
  const isComplexType = (obj) => Array.isArray(obj) || isPlainObject(obj);

  const getValueForRelationship = (relationshipData, included) => {
    if (opts && relationshipData && opts[relationshipData.type]) {
      const valueForRelationshipFct =
        opts[relationshipData.type].valueForRelationship;

      return valueForRelationshipFct(relationshipData, included);
    }

    return included;
  };

  const findIncluded = (relationshipData, ancestry) => {
    return new Promise((resolve) => {
      if (!jsonapi.included || !relationshipData) resolve(null);

      const included = _find(jsonapi.included, {
        id: relationshipData.id,
        type: relationshipData.type,
      });

      if (included) {
        // To prevent circular references, check if the record type
        // has already been processed in this thread
        if (ancestry.indexOf(included.type) > -1) {
          return Promise.all([extractAttributes(included)]).then(function (
            results
          ) {
            const attributes = results[0];
            const relationships = results[1];
            resolve(_extend(attributes, relationships));
          });
        }

        return Promise.all([
          extractAttributes(included),
          extractRelationships(
            included,
            ancestry + ":" + included.type + included.id
          ),
        ]).then((results) => {
          const attributes = results[0];
          const relationships = results[1];
          resolve(_extend(attributes, relationships));
        });
      }

      return resolve(null);
    });
  };

  const keyForAttribute = (attribute) => {
    if (isPlainObject(attribute)) {
      return _transform(attribute, (result, value, key) =>
        isComplexType(value)
          ? (result[keyForAttribute(key)] = keyForAttribute(value))
          : (result[keyForAttribute(key)] = value)
      );
    }
    if (Array.isArray(attribute))
      return attribute.map((attr) =>
        isComplexType(attr) ? keyForAttribute(attr) : attr
      );

    if (isFunction(opts.keyForAttribute))
      return opts.keyForAttribute(attribute);

    return Inflector.caserize(attribute, opts);
  };

  const extractAttributes = (from) => {
    const dest = keyForAttribute(from.attributes || {});

    if ("id" in from) dest[opts.id || "id"] = from.id;
    if (opts.typeAsAttribute && "type" in from) dest.type = from.type;
    if ("meta" in from) dest.meta = keyForAttribute(from.meta || {});

    return dest;
  };

  const extractRelationships = (from, ancestry) => {
    if (!from.relationships) return;

    const dest = {};

    return Promise.all(
      Object.keys(from.relationships).map((key) => {
        const relationship = from.relationships[key];

        if (relationship.data === null) dest[keyForAttribute(key)] = null;

        if (Array.isArray(relationship.data)) {
          return Promise.all(
            relationship.data.map((relationshipData) =>
              extractIncludes(relationshipData, ancestry)
            )
          ).then((includes) => {
            if (includes) dest[keyForAttribute(key)] = includes;
          });
        }
        return extractIncludes(relationship.data, ancestry).then((includes) => {
          if (includes) dest[keyForAttribute(key)] = includes;
        });
      })
    ).then(() => dest);
  };

  const extractIncludes = (relationshipData, ancestry) => {
    return findIncluded(relationshipData, ancestry).then((included) => {
      const valueForRelationship = getValueForRelationship(
        relationshipData,
        included
      );

      if (valueForRelationship && isFunction(valueForRelationship.then)) {
        return valueForRelationship.then((value) => value);
      }
      return valueForRelationship;
    });
  };

  const perform = () => {
    return Promise.all([
      extractAttributes(data),
      extractRelationships(data, data.type + data.id),
    ]).then((results) => {
      const attributes = results[0];
      const relationships = results[1];
      const record = _extend(attributes, relationships);

      if (jsonapi.links) record.links = jsonapi.links; // Links
      if (opts && opts.transform) record = opts.transform(record); // If option is present, transform record
      return record;
    });
  };

  return { perform };
};

export default deserializerUtils;
