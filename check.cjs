const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const nodes={};const context=vm.createContext({document:{querySelector:s=>nodes[s]??={innerHTML:'',setAttribute(){},addEventListener(){}},addEventListener(){}},localStorage:{getItem(){return null},setItem(){}}});
vm.runInContext(fs.readFileSync('procedures.js','utf8')+'\n'+fs.readFileSync('desk.js','utf8'),context);
const run=s=>vm.runInContext(s,context);
assert.equal(run('R.filter(r=>matches(r)).length'),27);
run("engine='Oracle';render()");assert.ok(!nodes['#cards'].innerHTML.includes('Connect locally as postgres'));
run("reset();query='socket';render()");assert.ok(nodes['#cards'].innerHTML.includes('Connect using the configured socket'));
run("reset();platform='windows'");assert.equal(run('R.filter(r=>matches(r)).length'),15);
run('reset();saved.add(key(R[0]));savedOnly=true');assert.equal(run('R.filter(r=>matches(r)).length'),1);
run("query='nonexistent-query';render()");assert.ok(nodes['#cards'].innerHTML.includes('No matching procedures'));
run('reset()');assert.equal(run('R.filter(r=>matches(r)).length'),27);
console.log('PASS: inventory, database/platform filters, search, favourites, empty state, reset');

for (const engine of ['Oracle','PostgreSQL','MySQL','MongoDB']) {
 run('reset();engine='+JSON.stringify(engine)+';category="Discover existing databases";platform="windows";render()');
 assert.ok(nodes['#cards'].innerHTML.includes('Discover '+engine+' services, processes and ports'));
 for (const other of ['Oracle','PostgreSQL','MySQL','MongoDB'].filter(e=>e!==engine)) assert.ok(!nodes['#cards'].innerHTML.includes('Discover '+other+' services, processes and ports'));
}
console.log('PASS: discovery procedures are separated by database');

run('reset();category="Install binaries";render()');assert.equal(run("R.filter(r=>matches(r)).length"),3);
