import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

export interface IDatabaseConfig {
  mode: 'mongodb' | 'embedded';
  uri?: string;
  connected: boolean;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'scholarship_store.json');

// Memory store for embedded fallback mode
class EmbeddedStore {
  private data: Record<string, any[]> = {
    users: [],
    students: [],
    applications: [],
    budgets: [],
    allocations: [],
  };
  private initialized = false;

  constructor() {
    this.loadFromFile();
  }

  private loadFromFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
      }
      this.initialized = true;
    } catch (err) {
      console.warn('[EmbeddedStore] Using in-memory store:', err);
      this.initialized = true;
    }
  }

  public saveToFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[EmbeddedStore] Failed to persist data to disk:', err);
    }
  }

  public getCollection(name: string): any[] {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }

  public setCollection(name: string, items: any[]) {
    this.data[name] = items;
    this.saveToFile();
  }

  public clear() {
    this.data = {
      users: [],
      students: [],
      applications: [],
      budgets: [],
      allocations: [],
    };
    this.saveToFile();
  }
}

export const embeddedStore = new EmbeddedStore();

let dbConfig: IDatabaseConfig = {
  mode: 'embedded',
  connected: false,
};

export async function connectDB(): Promise<IDatabaseConfig> {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri && !mongoUri.includes('localhost:27017')) {
    try {
      console.log(`[Database] Attempting connection to MongoDB at: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 3000,
      });
      dbConfig = {
        mode: 'mongodb',
        uri: mongoUri,
        connected: true,
      };
      console.log('[Database] Successfully connected to live MongoDB instance.');
      return dbConfig;
    } catch (err: any) {
      console.warn(`[Database] Could not connect to external MongoDB (${err.message}). Falling back to Embedded Mongoose Store.`);
    }
  }

  // Fallback to high-reliability embedded JSON document database
  dbConfig = {
    mode: 'embedded',
    connected: true,
  };
  console.log('[Database] Running on Embedded Mongoose Document Database (data/scholarship_store.json).');
  return dbConfig;
}

export function getDatabaseStatus() {
  return dbConfig;
}
