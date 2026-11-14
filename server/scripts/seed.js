import { connectDB, disconnectDB } from '../src/config/db.js';
import { Parcel } from '../src/models/Parcel.js';
import { toGeoPoint } from '../src/utils/location.js';
import { seedParcels } from './seedData.js';

async function seed() {
  await connectDB();

  await Parcel.syncIndexes();

  // Resets the collection: all existing parcels are removed before the dummy data is inserted.
  const { deletedCount } = await Parcel.deleteMany({});
  console.log(`[seed] Removed ${deletedCount} existing parcel(s)`);

  const docs = seedParcels.map((p) => ({ ...p, location: toGeoPoint(p.location) }));
  const inserted = await Parcel.insertMany(docs);
  console.log(`[seed] Inserted ${inserted.length} parcel(s)`);

  const byStatus = await Parcel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  console.log('[seed] Parcels by status:', Object.fromEntries(byStatus.map((s) => [s._id, s.count])));
  console.log('[seed] Example as the API will return it:\n', JSON.stringify(inserted[0].toJSON(), null, 2));
}

seed()
  .then(() => disconnectDB())
  .catch(async (error) => {
    console.error('[seed] Failed:', error.message);
    await disconnectDB().catch(() => {});
    process.exit(1);
  });
