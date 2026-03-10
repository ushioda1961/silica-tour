const fs = require('fs');
let c = fs.readFileSync('app/page.tsx', 'utf8');

// 41行目の初期値にprefectureを追加
c = c.replace(
  "lastName: '', firstName: '', lastNameKana: '', firstNameKana: '',",
  "lastName: '', firstName: '', lastNameKana: '', firstNameKana: '', prefecture: '',"
);

fs.writeFileSync('app/page.tsx', c);
console.log('done');
