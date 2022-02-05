import { typeDefs, extendedTypeDefs } from "./graphql-schema";
import { mergeSchemas } from "@graphql-tools/schema";
import { graphqlUploadExpress } from "graphql-upload";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import neo4j from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";
import {config} from "dotenv";
import * as express from "express";
import {createServer} from 'http';
import * as morgan from 'morgan';
import { createSchema } from "../s3";

//Env var config
config();

// Setup Neo4j graphql schema
const driver = neo4j.driver(
    process.env.DB_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
        process.env.DB_USER || 'default_user',
        process.env.DB_PASSWORD || 'default_password'
    )
);

const neoSchema = new Neo4jGraphQL({typeDefs, driver});

function context({event, context}: {event: any, context: any}): any {
    return ({
        event,
        context,
        driver
    });
}

// Setup S3 graphql schema
const s3Schema = createSchema(extendedTypeDefs);
const withS3Schema = mergeSchemas({
    schemas: [neoSchema.schema, s3Schema]
});


type AppServer = {
    server: ApolloServer<{
        event: any;
        context: any;
    }>;
    app: express.Express;
}


export const startApolloServer = async () => {
    const app = express();
    app.use(morgan('combined'));
    const httpServer = createServer(app);
    const server = new ApolloServer({
        schema: withS3Schema,
        introspection: true,
        context: context,
        plugins: [
            ApolloServerPluginDrainHttpServer({httpServer})
        ]
    });

    await server.start();
    app.use(graphqlUploadExpress());
    
    server.applyMiddleware({app});

    const port = process.env.PORT || 80;
    const path = process.env.GRAPHQL_SERVER_PATH || "/graphql";
    const host = process.env.GRAPHQL_SERVER_HOST || 'localhost';

    
    server.applyMiddleware({app, path});
    //Apply middleware
    //app.use('*', jwtCheck, requireAuth, checkScope);


    await new Promise<void>(resolve => httpServer.listen({host: host, port: port}, resolve));
    console.log(`GraphQL Server ready at http://${host}:${port}${path}`);
    return {server, app} as AppServer;
};