import { printSchema } from 'graphql/utilities';
import { EOL } from 'os';

const INDENT_SPACE = '  ';
const RM_INI_SPACES = /^\s{0,}/g;
const getInnerProps = (lines, startIndex) => {
  const linesToAdd = [];
  if (!lines) return null;
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].match(/(\w{1,}:\s{0,}[\w\[\]!]{1,}!{0,}){0,}\}/);
    if (line) {
      if (line[1]) linesToAdd.push(cleanLine(line[1]));
      return linesToAdd;
    }
    linesToAdd.push(cleanLine(lines[i]));
  }
  return null;
};

const isInnerLine = (line) => {
  if(typeof line === 'string'){
    return (line.match(/[\{\}]/) === null);
  }
}

const cleanLine = (line, inner=true) => {
  if(typeof line === 'string'){
    return line.replace(/^\s+/g, inner ? INDENT_SPACE : '');
  }
}

/**
 * Extend graphql input type
 * @param {string} input Input schema to extend
 * @param {string} extend schema text that extends the input
 * @returns {string}
 */
const extendInputFromText = (input, extend) => {
  const linesExtend = extend.split(EOL);
  const additionalSchema = [];
  let changedLinesText = '';
  for (let i = 0; i < linesExtend.length; i++) {
    const lineExtend = linesExtend[i].toString();
    const pattern = /((\w+)[\s]+extend|^[\s]?extend)[\s]+input[\s]+(\w+)[\s+]?\{[\s+]?/;
    const matchs = lineExtend.match(pattern);
    if (!matchs || !matchs[2]) {
      // add aditionalSchema
      const inner = isInnerLine(lineExtend);
      additionalSchema.push(cleanLine(lineExtend, inner));
      continue;
    }

    const inputName = matchs[3];
    const newInputName = matchs[2];
    if (!inputName) continue;

    const linesToAdd = getInnerProps(linesExtend, i);
    i += linesToAdd.length + 1; // one more '}'
    const linesInput = input.split(EOL);
    for (let ii = 0; ii < linesInput.length; ii++) {
      const lineInput = cleanLine(linesInput[ii], false);
      const pattern = /[\s]{0,}input[\s]{1,}(\w+)[\s]{0,}\{[\s]{0,}/;
      const matchs = lineInput.match(pattern);
      if (!matchs || matchs[1] !== inputName) continue;

      // if new input then don't change the existing one
      linesInput.splice(ii + 1, 0, ...linesToAdd);
      if (!newInputName) {
        input = linesInput.join(EOL);
        const changed = [lineInput, ...getInnerProps(linesInput, ii), '}'];
        changedLinesText += changed.join(EOL);
      } else {
        const changed = [
          lineInput.replace(inputName, newInputName),
          ...getInnerProps(linesInput, ii),
          '}'
        ];

        if (newInputName) {
          const textChanged = changed.join(EOL);
          input += EOL + textChanged;
          changedLinesText += textChanged;
        }
      }
      break;
    }
  }

  const additionalSchemaText = additionalSchema.length
    ? additionalSchema.join(EOL)
    : '';
  const finalInput = input + additionalSchemaText;
  return {
    schema: finalInput,
    partial: changedLinesText + additionalSchemaText
  };
};

/**
 * Extend graphql input type
 * @param {mixed} input Input schema to extend can be of type
 * GraphQLObject or schema text (GraphQL language)
 * @param {string} extend schema text that extends the input
 * @param {boolean} returnCompleteSchema whether to return a complete schema merge or partial changes
 * @returns {string} return the schema string - complete schema or partial depending on `returnCompleteSchema`
 */
const gqlExtI = (schema, extendGraphqlText, returnCompleteSchema = false) => {
  const schemaText = typeof schema === 'string' ? schema : printSchema(schema);
  const newSchema = extendInputFromText(schemaText, extendGraphqlText);

  if (returnCompleteSchema) return newSchema.schema;
  return newSchema.partial;
};

export default gqlExtI;
