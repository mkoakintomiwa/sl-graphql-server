import s3 from './load-s3';
import resolvers from './resolvers';
import typedefs from './typedefs';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { protectedUrlDirective, protectedUrlDirectiveTransformer, protectedUrlDirectiveTypeDefs } from './protected_url';

const createSchema = (inputDefs: string) => {
    let schema = makeExecutableSchema({
        typeDefs: [protectedUrlDirectiveTypeDefs, typedefs, inputDefs],
        resolvers: resolvers,
    });
    return protectedUrlDirectiveTransformer(schema);
}

export {s3, createSchema, protectedUrlDirective};