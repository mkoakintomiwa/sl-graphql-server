import s3, {bucketName} from './load-s3';
import { GraphQLUpload } from'graphql-upload';

// NOTE:
// Images use a __ in the filename as a replacement
// for a / in the final path on S3.
// So if it is to be in brand/<brand_id>/banner.jpg
// the upload filename should be:
// brand__<brand_id>__banner.jpg

let processUploadS3 = async (file: any)=>{
    const {createReadStream, mimetype, encoding, filename} = await file;
    let stream = createReadStream();
    const {Location} = await s3.upload({
        Body: stream,
        Key: `${filename.replace(/__/g, "/")}`,
        ContentType: mimetype,
        Bucket: bucketName
    }).promise();
    return new Promise((resolve,reject)=>{
        if (Location){
            resolve({
                success: true, message: "Uploaded", mimetype,filename,
                location: Location, encoding
            })
        }else {
            reject({
                success: false, message: "Failed"
            })
        }
    })
}
const resolvers: any = {
    Upload: GraphQLUpload,
    Mutation: {
        singleUpload : async (_: any, args: { file: any; })=>{
            return processUploadS3(args.file);
        },
        multipleUpload : async (_: any, args: { files: any; })=>{
            let obj = (await Promise.all(args.files)).map(processUploadS3);
            return obj;
        }
    }
}

export default resolvers;