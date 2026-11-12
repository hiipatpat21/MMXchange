// Local server-action mocks and real image decoding; no hosted credentials or Storage calls.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import sharp from "sharp";
const require = createRequire(import.meta.url);
function load(file, imports = {}) {
 const exports = {};
 const js = ts.transpileModule(readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
 vm.runInNewContext(js,{exports,Buffer,File,Error,require:name=>name in imports?imports[name]:require(name)},{filename:file});
 return exports;
}
const images=load("lib/payment-images.ts",{"server-only":{},"@/lib/lesson-payments":load("lib/lesson-payments.ts")});
const png=await sharp({create:{width:20,height:20,channels:3,background:"white"}}).png().toBuffer();
assert.deepEqual(await images.validatePaymentImage(new File([png],"qr.png",{type:"image/png"})),png);
for(const file of [new File([png],"wrong.jpg",{type:"image/jpeg"}),new File(["<svg/>"],"x.svg",{type:"image/svg+xml"}),new File(["broken"],"x.png",{type:"image/png"}),new File([new Uint8Array(2097153)],"big.png",{type:"image/png"})]) await assert.rejects(images.validatePaymentImage(file));
const user="11111111-1111-4111-8111-111111111111",id="22222222-2222-4222-8222-222222222222",asset="33333333-3333-4333-8333-333333333333",receipt="44444444-4444-4444-8444-444444444444";
let signedIn=true,uploadFails=false,networkFails=false,code="ok";
const calls=[],uploads=[],refresh=[];
const client={auth:{getUser:async()=>({data:{user:signedIn?{id:user}:null}})},rpc:async(name,args)=>{
 calls.push({name,args});if(networkFails)throw Error("offline");return {data:name==="allocate_payment_asset"?`ok:${asset}`:code,error:null};
},storage:{from:bucket=>({upload:async(path,bytes,options)=>{uploads.push({bucket,path,size:bytes.length,options});return {error:uploadFails?{}:null};}})}};
const actions=load("app/(app)/lessons/payment-actions.ts",{"@/lib/supabase/server":{createClient:async()=>client},"@/lib/payment-images":images,"@/lib/lesson-payments":load("lib/lesson-payments.ts"),"next/cache":{revalidatePath:(...args)=>refresh.push(args)}});
function form(values){const f=new FormData();for(const[k,v]of Object.entries(values))f.set(k,v);return f;}
const upload=()=>form({kind:"receipt",id,image:new File([png],"unsafe-name.svg",{type:"image/png"}),owner_id:receipt,path:"someone-else/receipt.png",amount:1});
signedIn=false;assert.ok((await actions.uploadPaymentImage(null,upload())).error);assert.equal(calls.length,0);signedIn=true;
assert.ok((await actions.uploadPaymentImage(null,form({kind:"receipt",id,image:new File(["bad"],"bad.png",{type:"image/png"})}))).error);assert.equal(calls.length,0);
assert.match((await actions.uploadPaymentImage(null,upload())).message,/Awaiting tutor/);
assert.equal(uploads[0].bucket,"lesson-receipts");assert.equal(uploads[0].path,`${user}/${asset}.png`);assert.equal(uploads[0].options.upsert,false);
assert.deepEqual(Object.keys(calls.at(-1).args),["p_request","p_asset"]);
uploadFails=true;let n=calls.filter(c=>c.name==="submit_lesson_receipt").length;assert.ok((await actions.uploadPaymentImage(null,upload())).error);assert.equal(calls.filter(c=>c.name==="submit_lesson_receipt").length,n);uploadFails=false;
networkFails=true;assert.match((await actions.uploadPaymentImage(null,upload())).error,/Connection/);networkFails=false;
assert.ok((await actions.changeLessonPayment(null,form({id,command:"reject",receipt,reason:"bad"}))).error);
code="not_allowed";assert.ok((await actions.changeLessonPayment(null,form({id,command:"confirm",receipt,tutor_id:user,amount:1}))).error);
assert.deepEqual(Object.keys(calls.at(-1).args),["p_request","p_receipt","p_decision","p_reason"]);
code="ok";assert.match((await actions.changeLessonPayment(null,form({id,command:"confirm",receipt}))).message,/now confirmed/);
let storageReads=0;
assert.equal(await images.paymentImageUrl({from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null,error:null})})})}),storage:{from:()=>{storageReads++;}}},asset),null);
assert.equal(storageReads,0);
const signed=await images.paymentImageUrl({from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{kind:"receipt",object_path:`${user}/${asset}.png`},error:null})})})}),storage:{from:bucket=>({createSignedUrl:async(path,seconds)=>{assert.equal(bucket,"lesson-receipts");assert.equal(seconds,300);assert.equal(path,`${user}/${asset}.png`);return {data:{signedUrl:"private-signed-url"},error:null};}})}},asset);
assert.equal(signed,"private-signed-url");
console.log("Payment checks passed: actual image decode/MIME/size, auth, unique server paths, no overwrite, upload/network failures, checked review payloads and authorized five-minute signed URLs.");
