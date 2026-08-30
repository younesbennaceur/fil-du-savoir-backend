import mongoose from 'mongoose';
import dns from 'node:dns';

const resolveWindowsSrvUri = async (uri) => {
  if (process.platform !== 'win32' || !uri?.startsWith('mongodb+srv://')) return uri;

  dns.setServers(['1.1.1.1', '8.8.8.8']);
  const parsed = new URL(uri);
  const [srvRecords, txtRecords] = await Promise.all([
    dns.promises.resolveSrv(`_mongodb._tcp.${parsed.hostname}`),
    dns.promises.resolveTxt(parsed.hostname).catch(() => [])
  ]);

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
  const conn = await mongoose.connect(connectionUri);
  console.log(`✅ Base de données MongoDB connectée : ${conn.connection.host}`);
  return conn;
};

export default connectDB;
