import { embeddedStore } from '../config/db.js';

export function generateId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const randomChars = Math.random().toString(16).substring(2, 18);
  return (timestamp + randomChars).padEnd(24, '0').substring(0, 24);
}

function matchesFilter(item: any, filter: Record<string, any> = {}): boolean {
  for (const key of Object.keys(filter)) {
    const val = filter[key];
    if (val === undefined) continue;

    if (key === '$or' && Array.isArray(val)) {
      const orMatches = val.some((subFilter) => matchesFilter(item, subFilter));
      if (!orMatches) return false;
      continue;
    }

    if (key === '$and' && Array.isArray(val)) {
      const andMatches = val.every((subFilter) => matchesFilter(item, subFilter));
      if (!andMatches) return false;
      continue;
    }

    const itemVal = item[key];

    if (val !== null && typeof val === 'object') {
      if ('$in' in val && Array.isArray(val.$in)) {
        if (!val.$in.includes(itemVal)) return false;
        continue;
      }
      if ('$nin' in val && Array.isArray(val.$nin)) {
        if (val.$nin.includes(itemVal)) return false;
        continue;
      }
      if ('$gte' in val) {
        if (Number(itemVal) < Number(val.$gte)) return false;
      }
      if ('$lte' in val) {
        if (Number(itemVal) > Number(val.$lte)) return false;
      }
      if ('$gt' in val) {
        if (Number(itemVal) <= Number(val.$gt)) return false;
      }
      if ('$lt' in val) {
        if (Number(itemVal) >= Number(val.$lt)) return false;
      }
      if ('$ne' in val) {
        if (itemVal === val.$ne) return false;
      }
      if ('$regex' in val) {
        const regex = new RegExp(val.$regex, val.$options || 'i');
        if (!regex.test(String(itemVal || ''))) return false;
      }
      continue;
    }

    // Direct equality
    if (itemVal !== val) {
      return false;
    }
  }
  return true;
}

export class GenericModel<T extends { _id?: string; createdAt?: string; updatedAt?: string }> {
  constructor(private collectionName: string) {}

  public async find(filter: Record<string, any> = {}): Promise<T[]> {
    const items = embeddedStore.getCollection(this.collectionName);
    return items.filter((item) => matchesFilter(item, filter)).map((i) => ({ ...i }));
  }

  public async findOne(filter: Record<string, any> = {}): Promise<T | null> {
    const items = embeddedStore.getCollection(this.collectionName);
    const found = items.find((item) => matchesFilter(item, filter));
    return found ? { ...found } : null;
  }

  public async findById(id: string): Promise<T | null> {
    const items = embeddedStore.getCollection(this.collectionName);
    const found = items.find((item) => item._id === id || item.id === id);
    return found ? { ...found } : null;
  }

  public async create(data: Partial<T>): Promise<T> {
    const items = embeddedStore.getCollection(this.collectionName);
    const now = new Date().toISOString();
    const doc = {
      _id: generateId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    } as unknown as T;

    items.push(doc);
    embeddedStore.setCollection(this.collectionName, items);
    return { ...doc };
  }

  public async findByIdAndUpdate(id: string, update: Partial<T>, options: { new?: boolean } = { new: true }): Promise<T | null> {
    const items = embeddedStore.getCollection(this.collectionName);
    const index = items.findIndex((item) => item._id === id || item.id === id);
    if (index === -1) return null;

    const current = items[index];
    const updated = {
      ...current,
      ...update,
      _id: current._id, // guarantee immutable id
      updatedAt: new Date().toISOString(),
    };

    items[index] = updated;
    embeddedStore.setCollection(this.collectionName, items);
    return { ...updated };
  }

  public async findByIdAndDelete(id: string): Promise<T | null> {
    const items = embeddedStore.getCollection(this.collectionName);
    const index = items.findIndex((item) => item._id === id || item.id === id);
    if (index === -1) return null;

    const [deleted] = items.splice(index, 1);
    embeddedStore.setCollection(this.collectionName, items);
    return deleted;
  }

  public async deleteOne(filter: Record<string, any>): Promise<{ deletedCount: number }> {
    const items = embeddedStore.getCollection(this.collectionName);
    const index = items.findIndex((item) => matchesFilter(item, filter));
    if (index === -1) return { deletedCount: 0 };

    items.splice(index, 1);
    embeddedStore.setCollection(this.collectionName, items);
    return { deletedCount: 1 };
  }

  public async deleteMany(filter: Record<string, any>): Promise<{ deletedCount: number }> {
    const items = embeddedStore.getCollection(this.collectionName);
    const remaining = items.filter((item) => !matchesFilter(item, filter));
    const deletedCount = items.length - remaining.length;
    embeddedStore.setCollection(this.collectionName, remaining);
    return { deletedCount };
  }

  public async countDocuments(filter: Record<string, any> = {}): Promise<number> {
    const items = embeddedStore.getCollection(this.collectionName);
    return items.filter((item) => matchesFilter(item, filter)).length;
  }
}
