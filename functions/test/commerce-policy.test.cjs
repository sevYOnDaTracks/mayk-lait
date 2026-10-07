const {test}=require('node:test');
const assert=require('node:assert/strict');
const {isDeliverablePostalCode,orderIdForRequest}=require('../lib/commerce-policy');
test('delivery accepts all eight Île-de-France departments',()=>{
 for(const code of ['75001','77000','78120','91000','92000','93000','94000','95000']) assert.equal(isDeliverablePostalCode(code),true);
});
test('delivery rejects other departments and malformed postal codes',()=>{
 for(const code of ['69001','13001','97100','7500','750001','75abc','', '2A004']) assert.equal(isDeliverablePostalCode(code),false);
});
test('retry resolves to the same order but users and new requests stay separate',()=>{
 assert.equal(orderIdForRequest('customer-a','request-1'),orderIdForRequest('customer-a','request-1'));
 assert.notEqual(orderIdForRequest('customer-a','request-1'),orderIdForRequest('customer-b','request-1'));
 assert.notEqual(orderIdForRequest('customer-a','request-1'),orderIdForRequest('customer-a','request-2'));
});
