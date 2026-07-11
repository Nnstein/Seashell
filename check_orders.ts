import { db } from './apps/management-app/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

async function checkOrders() {
    const q = query(collection(db, 'orders'), limit(10));
    const snaps = await getDocs(q);
    for (const snap of snaps.docs) {
        console.log(snap.id, JSON.stringify(snap.data().items, null, 2));
    }
    const q2 = query(collection(db, 'order_history'), limit(10));
    const snaps2 = await getDocs(q2);
    for (const snap of snaps2.docs) {
        console.log('HISTORY', snap.id, JSON.stringify(snap.data().items, null, 2));
    }
    process.exit(0);
}

checkOrders();
