import "server-only";
import { MongoClient, ObjectId, type Db } from "mongodb";

const globalForMongo = globalThis as unknown as { novaMongo?: Promise<MongoClient> };

export const dbConfigured = () => Boolean(process.env.MONGODB_URI);

/** One shared connection per server process (reused across hot reloads in development). */
export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set.");
  if (!globalForMongo.novaMongo) {
    const connecting = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 }).connect();
    globalForMongo.novaMongo = connecting.catch((error) => {
      globalForMongo.novaMongo = undefined;
      throw error;
    });
  }
  return (await globalForMongo.novaMongo).db(process.env.MONGODB_DB || "novahomin");
}

export const toId = (value: string) => (ObjectId.isValid(value) ? new ObjectId(value) : null);
export const iso = (value: unknown) => (value instanceof Date ? value.toISOString() : "");
