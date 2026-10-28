import {buildDomestic} from './package-domestic.mjs';
export {buildDomestic};
if(process.argv[1]===import.meta.filename){const index=process.argv.indexOf('--out');try{console.log(JSON.stringify(await buildDomestic(index===-1?null:process.argv[index+1])));}catch(error){console.error(error.message);process.exitCode=1;}}
