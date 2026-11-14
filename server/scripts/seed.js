// Fills the database with dummy parcels.
// Run with:  npm run seed   (from the server folder)
//
// WARNING: this deletes all existing parcels first, so the database always
// starts from the same known state. Only use it on development data.
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Parcel } from '../src/models/Parcel.js';
import { toGeoPoint } from '../src/utils/location.js';
import { seedParcels } from './seedData.js';

async function seed() {
  await connectDB();

  // Make sure the indexes defined in the model exist in the database.
  await Parcel.syncIndexes();

  const { deletedCount } = await Parcel.deleteMany({});
  console.log(`[seed] Removed ${deletedCount} existing parcel(s)`);

  // Convert { lat, lng } to GeoJSON before saving.
  const docs = seedParcels.map((p) => ({ ...p, location: toGeoPoint(p.location) }));
  const inserted = await Parcel.insertMany(docs); // runs schema validation on every document
  console.log(`[seed] Inserted ${inserted.length} parcel(s)`);

  // Short summary so you can see the data is really there.
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
