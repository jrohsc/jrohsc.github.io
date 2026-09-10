import express from 'express';
import {getConferences} from './conferences.js';
import {enrichAffiliations,affiliationCache} from './affiliations.js';
import {enrichFigures,figureCache} from './figures.js';
import {refreshBlogs,blogSnapshot} from './blogs.js';
import {refreshPapers,paperSnapshot} from './papers.js';
import {fileURLToPath} from 'node:url';
const app=express();const root=fileURLToPath(new URL('.',import.meta.url));
let affiliationJob=false;
app.get('/api/affiliations',async(req,res)=>{
 if(req.query.id){const paper=paperSnapshot().papers.find(p=>p.id===req.query.id);if(!paper)return res.status(404).json({error:'Paper not found'});return res.json(await enrichAffiliations([paper],{limit:1}));}
 if(!affiliationJob){affiliationJob=true;enrichAffiliations(paperSnapshot().papers).finally(()=>{affiliationJob=false});}
 res.json({...affiliationCache(),refreshing:affiliationJob});
});
let figuresPending=false;
app.get('/api/figures',(req,res)=>{if(!figuresPending){figuresPending=true;enrichFigures(paperSnapshot().papers).finally(()=>{figuresPending=false});}res.json(figureCache());});
app.get('/api/blogs',(req,res)=>{refreshBlogs().catch(()=>{});res.json(blogSnapshot());});
app.get('/api/conferences',async(req,res)=>res.json(await getConferences()));
app.get('/api/papers',(req,res)=>{refreshPapers().catch(()=>{});res.json(paperSnapshot());});
if(process.env.NODE_ENV==='production')app.use(express.static(root+'dist'));
else{const {createServer}=await import('vite');const vite=await createServer({root,server:{middlewareMode:true}});app.use(vite.middlewares);}
app.listen(Number(process.env.PORT)||5173,'127.0.0.1',()=>console.log('SENTINEL running at http://localhost:5173'));
