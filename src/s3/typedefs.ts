import {gql} from 'apollo-server-express';

const typedefs = gql`
    scalar Upload

    type Query {
        uploadedFiles : [File]
    }
    type Mutation {
        singleUpload (file: Upload!) : File
        multipleUpload (files: [Upload]!) : [File]
    }
    type File {
        success: String!
        message: String!
        mimetype: String
        encoding: String
        filename: String
        location: String
    }
`;

export interface File {
    success : String;
    message : String;
    mimetype : String;
    encoding : String;
    filename : String;
    location : String;
}

export default typedefs;