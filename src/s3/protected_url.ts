import { mapSchema, getDirectives, MapperKind } from '@graphql-tools/utils'
import { defaultFieldResolver, GraphQLSchema } from 'graphql'
import {URL} from "url";
import s3, {bucketName, targetS3HostName} from './load-s3';

const _defaultExpiration = 60*60;

const  generatePresignedUrl = (url: string) => {
    const _url = new URL(url);
    if (_url.hostname == targetS3HostName) {
        return s3.getSignedUrl('getObject', {
            Bucket: bucketName,
            Key: _url.pathname.substring(1),
            Expires: _defaultExpiration  
        })
    } else {
        return url;
    }
}

function protectedUrlDirective(directiveName: string) {
    return {
        protectedUrlDirectiveTypeDefs: `directive @${directiveName} on FIELD_DEFINITION`,
        protectedUrlDirectiveTransformer: (schema: GraphQLSchema) => mapSchema(schema, {
            [MapperKind.OBJECT_FIELD]: fieldConfig => {
                const directives = getDirectives(schema, fieldConfig)
                let hasDirective = false;
                for (var i=0; i<directives.length; i++){
                    if (directives[i].name == directiveName) {
                        hasDirective = true;
                        break;
                    }
                }

                if (hasDirective) {
                    const { resolve = defaultFieldResolver } = fieldConfig
                    fieldConfig.resolve = async function(source, args, context, info) {
                        const result = await resolve(source, args, context, info)
                        if (result == null) { return result;}
                        if (typeof result === 'string') {
                            return generatePresignedUrl(result);
                        }
                        if (typeof result === 'object' && (result as Array<string>).length>0) {
                            // is a list
                            return [...(result as Array<string>).map((value, _) => {
                                return generatePresignedUrl(value);
                            }).values()];
                        }
                        return result;
                    }
                }
                return fieldConfig;
            }
        }),
    };
}

const { protectedUrlDirectiveTypeDefs, protectedUrlDirectiveTransformer } = protectedUrlDirective("protectedUrl");
export {protectedUrlDirective, protectedUrlDirectiveTypeDefs, protectedUrlDirectiveTransformer};