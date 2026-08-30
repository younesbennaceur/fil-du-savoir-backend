import mongoose from 'mongoose';
import dns from 'node:dns';

const resolveWindowsSrvUri = async (uri) => {
  if (process.platform !== 'win32' || !uri?.startsWith('mongodb+srv://')) return uri;

  dns.setServers(['1.1.1.1', '8.8.8.8']);
  const parsed = new URL(uri);
  const knownCluster = parsed.hostname === 'cluster0.pw9f6ct.mongodb.net';
  const srvRecords = knownCluster
    ? [
        { name: 'ac-7ypbxna-shard-00-00.pw9f6ct.mongodb.net', port: 27017 },
        { name: 'ac-7ypbxna-shard-00-01.pw9f6ct.mongodb.net', port: 27017 },
        { name: 'ac-7ypbxna-shard-00-02.pw9f6ct.mongodb.net', port: 27017 }
      ]
    : await dns.promises.resolveSrv(`_mongodb._tcp.${parsed.hostname}`);
  const txtRecords = knownCluster
    ? [['authSource=admin&replicaSet=atlas-43qelv-shard-0']]
    : await dns.promises.resolveTxt(parsed.hostname).catch(() => []);

  const credentials = parsed.username
    ? `${parsed.username}${parsed.password ? `:${parsed.password}` : ''}@`
    : '';
  const hosts = srvRecords.map(({ name, port }) => `${name}:${port}`).join(',');
  const options = new URLSearchParams(parsed.search);
  txtRecords.flat().join('&').split('&').filter(Boolean).forEach((entry) => {
    const [key, value] = entry.split('=');
    if (key && !options.has(key)) options.set(key, value || '');
  });
  options.set('tls', 'true');

  return `mongodb://${credentials}${hosts}${parsed.pathname || '/'}?${options.toString()}`;
};

const connectDB = async () => {
  const connectionUri = await resolveWindowsSrvUri(process.env.MONGO_URI);
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const conn = await mongoose.connect(connectionUri, {
        family: 4,
        serverSelectionTimeoutMS: 15000
      });
      console.log(`✅ Base de données MongoDB connectée : ${conn.connection.host}`);
      return conn;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        console.warn(`⚠️ Connexion MongoDB indisponible (tentative ${attempt}/3), nouvel essai…`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  throw lastError;
};

export default connectDB;
