const fs = require('fs');
let c = fs.readFileSync('app/page.tsx', 'utf8');

// setStep(0)のsetFormにuserTypeを追加
c = c.replace(
  "setStep(0); setForm({ lastName: '', firstName: '', lastNameKana: '', firstNameKana: '',",
  "setStep(0); setForm({ lastName: '', firstName: '', lastNameKana: '', firstNameKana: '', userType: 'customer',"
);

fs.writeFileSync('app/page.tsx', c);
console.log('done');
