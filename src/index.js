import { printSchema } from 'graphql/utilities';
import { EOL } from 'os';

const INDENT_SPACE = '  ';
const INPUT_NAME_LOOKUP_PATTERN = /([\W]|^)input\s+(\w+)[\s]{0,}/;
const EXTEND_PATTERN = /((\w+)\s+extend|^[\s+]{0,}extend)\s+input\s+(\w+)[\s+]?(([\s]{0,},[\s]{0,}(\w+)[\s]{0,})+){0,}\{/;
const INNER_PROP_PATTERN = /(\w{1,}:\s{0,}[\w\[\]!]{1,}!{0,}){0,}\}/;

const getInnerProps = (lines, startIndex) => {
  const linesToAdd = [];
  if (!lines) return null;
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].match(INNER_PROP_PATTERN);
    if (line) {
      if (line[1]) linesToAdd.push(line[1]);
      return linesToAdd;
    }
    linesToAdd.push(lines[i]);
  }
  return null;
};

const isInnerLine = line => {
  if (typeof line === 'string') return line.match(/[\{\}]/) === null;

  return null;
};

const cleanLine = (line, inner = true) => {
  if (typeof line === 'string')
    return line.replace(/^\s+/g, inner ? INDENT_SPACE : '');
};

const getAdditionalMatches = group => {
  if (!group) return;
  const additional = [];
  group.split(',').forEach(item => {
    const add = item.replace(/ /g, '');
    if (add) additional.push(add);
  });
  return additional;
};

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
    const lineExtend = linesExtend[i];
    const matchs = lineExtend.match(EXTEND_PATTERN);
    if (!matchs || !matchs[3]) {
      // add aditionalSchema
      additionalSchema.push(lineExtend);
      continue;
    }

    const inputName = matchs[3];
    const newInputName = matchs[2];

    if (!inputName) continue;

    const linesToAdd = getInnerProps(linesExtend, i);
    i += linesToAdd.length + 1; // one more '}'
    const linesInput = input.split(EOL);

    // get additional extends
    const additionalMatches = getAdditionalMatches(matchs[4]);
    if (additionalMatches && additionalMatches.length)
      for (const addInput of additionalMatches)
        for (let z = 0; z < linesInput.length; z++) {
          const matchs = linesInput[z].match(INPUT_NAME_LOOKUP_PATTERN);
          if (matchs && matchs[2] === addInput)
            linesToAdd.push(...getInnerProps(linesInput, z));
        }

    for (let ii = 0; ii < linesInput.length; ii++) {
      const lineInput = linesInput[ii];
      const matchs = lineInput.match(INPUT_NAME_LOOKUP_PATTERN);

      if (!matchs || matchs[2] !== inputName) continue;

      // if new input then don't change the existing one
      linesInput.splice(ii + 1, 0, ...linesToAdd);
      if (!newInputName) {
        input = linesInput.join(EOL);
        const changed = [
          lineInput,
          ...getInnerProps(linesInput, ii),
          '}' + EOL
        ];
        changedLinesText += changed.join(EOL);
      } else {
        const changed = [
          lineInput.replace(inputName, newInputName),
          ...getInnerProps(linesInput, ii),
          '}' + EOL
        ];

        const textChanged = changed.join(EOL);
        input += textChanged;
        changedLinesText += textChanged;
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

const formatSchema = schemaText => {
  if (typeof schemaText !== 'string') return '';

  const text = [];
  schemaText.split(EOL).forEach(line => {
    if (line.replace(/ /g, '') === '') return;
    const inner = isInnerLine(line);
    text.push(cleanLine(line, inner));
  });
  return text.join(EOL);
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

  if (returnCompleteSchema) return formatSchema(newSchema.schema);
  return formatSchema(newSchema.partial);
};

export default gqlExtI;
