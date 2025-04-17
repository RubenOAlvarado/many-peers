import Hyperswarm from "hyperswarm";
import crypto from "hypercore-crypto";
import b4a from "b4a";

const swarm = new Hyperswarm();

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function shutdown(){
    console.log('shutting down...');
    try {
        await swarm.destroy();
        console.log('Shutdown complete.');
    } catch (error) {
        console.error(`Error during shutdown: ${error}`);
        process.exit(0);
    }
}

const conns = [];

swarm.on("connection", conn => {
  const name = b4a.toString(conn.remotePublicKey, 'hex');
  console.log("* got a connection from: ", name, '*');
  conns.push(conn);
  conn.once('close', () => conns.splice(conns.indexOf(conn), 1));
  conn.on('data', data => console.log(`${name}: ${data}`));
  conn.on('error', e => console.log(`Connection error: ${e}`));
});

process.stdin.on('data', d => {
    for(const conn of conns){
        conn.write(d);
    }
});

const topic = process.argv[2] ? b4a.from(process.argv[2], 'hex') : crypto.randomBytes(32);
const discovery = swarm.join(topic, { client: true, server: true });

discovery.flushed().then(() => console.log('joined topic: ', b4a.toString(topic, 'hex')));