import * as fs from 'fs';
import * as path from 'path';

/*
 * Check for GRAPHQL_SCHEMA environment variable to specify schema file
 * fallback to schema.graphql if GRAPHQL_SCHEMA environment variable is not set
 */

export const typeDefs = fs.readFileSync(
    process.env.GRAPHQL_SCHEMA || path.join(__dirname, 'schema.graphql')
).toString('utf-8');

export const extendedTypeDefs = fs.readFileSync(
    process.env.GRAPHQL_SCHEMA_EXT || path.join(__dirname, 'extended_schema.graphql')
).toString('utf-8');