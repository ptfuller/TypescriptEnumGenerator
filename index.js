#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import sql from 'mssql';


const readConfig = () => {
  return new Promise((res, rej) => {
    const configPath = path.join(process.cwd(), 'ts-enum-config.json');

    fs.readFile(configPath, (err, data) => {
      const configJson = JSON.parse(data);
      res(configJson);
    });
  });
}

const readTable = async (config) => {
  const columns = config.tableConfig.includeColumns.join(',');
  let sqlString = `select ${columns} from ${config.tableConfig.table} `;
  if (config.tableConfig.where) {
    sqlString += `where ${config.tableConfig.where}`;
  }
  await sql.connect(config.connectionString);
  const result = await sql.query(sqlString);
  return result.recordset;
}

const readTableToBuildEnum = async (config) => {
  try {
    const enumsToBuild = [];

    await sql.connect(config.connectionString);

    for (let i = 0; i < config.enumConfig.length; i++) {
      const enumConfig = config.enumConfig[i];

      const where = enumConfig.where ? `where ${enumConfig.where}` : '';

      const result = await sql.query(`
        select
          ${enumConfig.enumValueColumn} as Value, 
          ${enumConfig.enumCategoryColumn} as Category, 
          ${enumConfig.enumNameColumn} as Name 
        from ${enumConfig.table} 
        ${where} 
        order by ${enumConfig.enumCategoryColumn}`);

      enumsToBuild.push(result.recordset);
    }

    await sql.close();

    return enumsToBuild;

  } catch (err) {
    console.error(err);
  }
}

const buildEnums = (enumsToBuild, config) => {
  for (let i = 0; i < enumsToBuild.length; i++) {
    let enumsString;
    if(config.enumFlatKey) {
      enumsString = buildFlatEnum(enumsToBuild[i], config.enumFlatKey)
    } else {
      enumsString = buildEnum(enumsToBuild[i]);
    }
    const relConfig = config.enumConfig[i];

    writeEnum(enumsString, relConfig);
  }
}

const unique = (value, index, self) => {
  return self.indexOf(value) === index
}

const cleanName = (name) => {
  const n = name.replace(/\W/g, '');
  if (n.match(/^\d/)) {
    return `_${n}`;
  }
  return n;
}

const cleanValue = (value) => {
  return parseInt(value.replace(/\D/g, ''));
}

const buildEnum = (enumToBuild) => {
  const categories = enumToBuild.map(x => x.Category).filter(unique);
  let enums = [];

  categories.forEach(c => {
    let valuesInCategory = enumToBuild.filter(x => x.Category === c);
    let lines = valuesInCategory.map((v, idx) => `${cleanName(v.Name)} = ${cleanValue(v.Value)}${idx < valuesInCategory.length - 1 ? ',' : ''}`);
    let str = `export enum ${cleanName(c)} {\n  ${lines.join('\n  ')}\n}`;
    enums.push(str);
  });

  return enums.join('\n\n');
}

const buildFlatEnum = (enumToBuild,flatKey) => {
  const lines = enumToBuild.map((v, idx) => `${cleanName(v.Name)} = ${cleanValue(v.Value)}${idx < valuesInCategory.length - 1 ? ',' : ''}`);
  const enums = `export enum ${cleanName(flatKey)} {\n  ${lines.join('\n  ')}\n}`;
  return enums.join('\n\n');
}

const writeEnum = (str, config) => {
  const writeTo = path.join(process.cwd(), config.outputFile);
  fs.writeFile(writeTo, str, null, cb => {

  });
}

const writeTableJson = (config, tableArray) => {
  return new Promise((res, rej) => {
    const tableJson = JSON.stringify(tableArray, null, 2);
    const writeTo = path.join(process.cwd(), config.tableConfig.outputFile);

    fs.writeFile(writeTo, tableJson, null, cb => {
      if (cb) rej();
      res();
    })
  });
}

const start = async () => {
  try {
    const config = await readConfig();

    const enumsToBuild = await readTableToBuildEnum(config);
    buildEnums(enumsToBuild, config);

    const ttb = await readTable(config);
    await writeTableJson(config, ttb);
  } catch (err) {
    console.error('bad things happened', err);
  }
}

start().catch(err => console.error(err));