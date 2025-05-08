import { MongoClient, MongoClientOptions } from "mongodb";

// Define the type for the global object extension
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error("Please add your MongoDB URI to .env");
}

if (process.env.NODE_ENV === "development") {
  // Type assertion to ensure TypeScript knows global._mongoClientPromise is defined
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise as Promise<MongoClient>;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;