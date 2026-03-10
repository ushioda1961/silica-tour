const fs = require('fs');
let c = fs.readFileSync('app/page.tsx', 'utf8');

// prefecture重複を修正
c = c.replace(
  "lastName: '', firstName: '', lastNameKana: '', firstNameKana: '', prefecture: '', userType: 'customer', prefecture: '',",
  "lastName: '', firstName: '', lastNameKana: '', firstNameKana: '', prefecture: '', userType: 'customer',"
);

fs.writeFileSync('app/page.tsx', c);
console.log('done');
