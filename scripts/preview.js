// Local-only browser preview for visual QA. Not a WeChat runtime emulator.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const allowed=new Set(['/tests/preview.html','/game.js','/utils/canvas-game.js','/utils/controller.js','/utils/engine.js','/utils/levels.js','/utils/level-plan.js','/utils/input.js','/utils/rating.js']);
http.createServer((req,res)=>{
 const route=new URL(req.url,'http://localhost').pathname;
 if(!allowed.has(route)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',route.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8');
 fs.createReadStream(path.join(root,route)).pipe(res);
}).listen(8790,'127.0.0.1',()=>console.log('Canvas preview: http://127.0.0.1:8790/tests/preview.html'));
