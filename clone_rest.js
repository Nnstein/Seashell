/**
 * Clone Room Service items to Seashell menu via Firestore REST API
 */
const https = require('https');
const fs    = require('fs');

const LOG = 'clone_progress.log';
fs.writeFileSync(LOG, `=== Clone started ${new Date().toISOString()} ===\n`);
const log = (...args) => {
    const line = args.join(' ');
    fs.appendFileSync(LOG, line + '\n');
    process.stdout.write(line + '\n');
};

const PROJECT_ID = 'seashell-meal-menu';
const BASE_PATH  = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/menu_items`;
const HOST       = 'firestore.googleapis.com';
const agent      = new https.Agent({ keepAlive: true, maxSockets: 1 });

function httpsReq(method, path, bodyObj) {
    return new Promise((resolve, reject) => {
        let bodyStr = null;
        const hdrs  = {};
        if (bodyObj) {
            bodyStr = JSON.stringify(bodyObj);
            hdrs['Content-Type']   = 'application/json';
            hdrs['Content-Length'] = Buffer.byteLength(bodyStr);
        }
        const opts = { host: HOST, path, method, agent, headers: hdrs };
        const req  = https.request(opts, res => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end',  () => {
                try   { resolve({ s: res.statusCode, b: JSON.parse(raw) }); }
                catch { resolve({ s: res.statusCode, b: raw }); }
            });
        });
        req.on('error', reject);
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

async function fetchAll() {
    let docs = [], tok = null;
    do {
        const path = BASE_PATH + `?pageSize=300${tok ? '&pageToken=' + encodeURIComponent(tok) : ''}`;
        const r = await httpsReq('GET', path, null);
        if (r.s !== 200) throw new Error(`GET ${r.s}: ${JSON.stringify(r.b).slice(0, 300)}`);
        docs = docs.concat(r.b.documents || []);
        tok  = r.b.nextPageToken || null;
    } while (tok);
    return docs;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function name(f) {
    return f?.name?.stringValue
        || f?.name?.mapValue?.fields?.en?.stringValue
        || '(Unknown)';
}

async function main() {
    log('Fetching all items...');
    const all = await fetchAll();
    log(`Total: ${all.length}`);

    const rs   = all.filter(d => d.fields?.menu?.stringValue === 'room-service');
    const ss   = all.filter(d => d.fields?.menu?.stringValue === 'seashell');
    const have = new Set(ss.map(d => name(d.fields)));
    const todo = rs.filter(d => !have.has(name(d.fields)));

    log(`RS: ${rs.length}  SS: ${ss.length}  To clone: ${todo.length}`);

    if (!todo.length) { log('Nothing to clone.'); return; }

    let ok = 0, bad = 0;

    for (let i = 0; i < todo.length; i++) {
        const n = name(todo[i].fields);
        log(`[${i + 1}/${todo.length}] ${n}`);

        // Build clean fields object
        const src  = todo[i].fields;
        const f    = JSON.parse(JSON.stringify(src));
        f.menu     = { stringValue: 'seashell' };

        let done = false;
        for (let a = 1; a <= 4 && !done; a++) {
            try {
                const r = await httpsReq('POST', BASE_PATH, { fields: f });
                if (r.s === 200 || r.s === 201) {
                    done = true;
                    log(`  → OK (HTTP ${r.s})`);
                } else {
                    log(`  → HTTP ${r.s} attempt ${a}: ${JSON.stringify(r.b).slice(0, 150)}`);
                    await sleep(400 * a);
                }
            } catch (e) {
                log(`  → ERR attempt ${a}: ${e.message}`);
                await sleep(400 * a);
            }
        }

        if (done) ok++; else { bad++; log(`  ✘ SKIPPED`); }
        await sleep(80);
    }

    log(`\n=== DONE: ${ok} copied, ${bad} failed ===`);
}

main().catch(e => { log('FATAL: ' + (e.stack || e)); process.exit(1); });
