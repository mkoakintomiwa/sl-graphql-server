import * as S3 from 'aws-sdk/clients/s3';

export const bucketName = process.env.AWS_BUCKET ?? "";
export const targetS3HostName = [bucketName, 's3', process.env.AWS_REGION, 'amazonaws.com'].join('.');

let s3 = new S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
    region: process.env.AWS_REGION ?? "",
    params: {
        Bucket: bucketName,
    }
});

export default s3;