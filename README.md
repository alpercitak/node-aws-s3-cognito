# aws-s3-cognito

drag & drop multiple files and upload them to aws s3 with using cognito identity

create an aws cognito identity\
https://docs.aws.amazon.com/cognito/latest/developerguide/tutorial-create-identity-pool.html

create an .env file using the template of .env.example and fill it with s3 region, identity and the bucket

```
.env

AWS_REGION="region"
AWS_IDENTITY="identity"
AWS_BUCKETNAME="bucket"
```

run the project locally

```
npm i (or yarn install)
npm run start
```

run the project on docker

```
docker-compose up --build
```

bundling assets

```
npx webpack
```
