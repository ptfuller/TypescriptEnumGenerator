# typescript-enum-generator
*Generate TypeScript Enums from MSSQL Tables*


Given a SQL table with a Name, Category, and Value:

|Id|AttributeName|CategoryName|
|--|-------------|------------|
|1|Active|AccountStatus|
|2|InActive|AccountStatus|
|3|U.S. Citizen|CitizenshipStatus|
|4|Non U.S. Citizen|CitizenshipStatus|

This project can generate TypeScript enums that look like this:

```TypeScript
export enum AccountStatus {
  Active = 1,
  InActive = 2
}

export enum CitizenshipStatus {
  USCitizen = 3,
  NonUSCitizen = 4
}

```
This has been useful for querying and filtering results from a GraphQL API

---
## Getting Started

### installation
```
npm install typescript-enum-generator
```

### Configuration
Add a ts-enum-config.json file to the root of your project
```JSON
{
  "connectionString": "mssql://<user>:<password>@<server>/<database>",
  "enumConfig": [
    {
      "table": "Attribute",
      "enumCategoryColumn": "CategoryName",
      "enumNameColumn": "AttributeName",
      "enumValueColumn": "Id",
      "outputFile": "<path relative to project root>/AttributeEnum.ts"
    }
  ]
}
```
Add **?encrypt=true** to the end of the connection string if using Azure SQL

### Generate Code
```
ts-enum
```

A file will be generated at the given path per enumConfig

Thanks!