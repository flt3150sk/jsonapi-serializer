import underscore from "inflected/underscore";
import dasherize from "inflected/dasherize";
import camelize from "inflected/camelize";
import inflectedPluralize from "inflected/pluralize";

const inflector = {
  caserize: (attribute, opts) => {
    attribute = underscore(attribute);

    switch (opts.keyForAttribute) {
      case "dash-case":
      case "lisp-case":
      case "spinal-case":
      case "kebab-case":
        return dasherize(attribute);
      case "underscore_case":
      case "snake_case":
        return attribute;
      case "CamelCase":
        return camelize(attribute);
      case "camelCase":
        return camelize(attribute, false);
      default:
        return dasherize(attribute);
    }
  },
  pluralize: (type) => inflectedPluralize(type),
};

export default inflector;
