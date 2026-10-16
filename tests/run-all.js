const {spawnSync}=require('node:child_process');
const path=require('node:path');
const tests=['engine.test.js','optimal.test.js','input-rating.test.js','page.test.js','campaign.test.js','minigame.test.js','miniprogram-host.test.js','wechat-loader.test.js'];
for(const name of tests) {
  const result=spawnSync(process.execPath,[path.join(__dirname,name)],{cwd:path.resolve(__dirname,'..'),stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status||1);
}
console.log('All 8 test suites passed. Device verification remains separate.');
