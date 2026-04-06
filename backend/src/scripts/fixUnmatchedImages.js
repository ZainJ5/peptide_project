require('dotenv').config();
const db = require('../models');

(async () => {
  const [count] = await db.Peptide.update(
    { reconstitutionImageUrl: '/reconstitution-images/tesamorelin-5mg-ipamorelin-5mg.webp' },
    { where: { protocolTitle: 'Tesamorelin 5MG + Ipamorelin 5MG 10MG' } }
  );
  console.log('Updated Tesamorelin+Ipamorelin:', count);
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
