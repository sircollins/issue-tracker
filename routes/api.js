/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB;   // MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      var project = req.params.project;
      const query = req.query;
      let lookFor = Object.keys(query).reduce(function(obj, k) {
        if (query[k] !== '') obj[k] = query[k];
        return obj;
      }, {});
    
    if (lookFor.open === 'false') lookFor.open = false;
    
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection(project).find(lookFor).toArray((err, docs) => {
          if (err) console.log(err);
          
          res.json(docs);
          
          db.close();
        });
      });    
    })
    
    .post(function (req, res){
      var project = req.params.project;
      const body = req.body;
      const newEntry = {
        issue_title: body.issue_title,
        issue_text: body.issue_text,
        created_by: body.created_by,
        created_on: new Date(),
        updated_on: new Date(),
        assigned_to: body.assigned_to || "",
        status_text: body.status_text || "",
        open: true
      }
    
      if (body.issue_title === undefined || (body.issue_text === undefined || body.created_by === undefined)) return res.json('missing inputs')
      
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection(project).insertOne(newEntry, (err, docs) => {
          if (err) res.json(err);
          res.json(docs.ops[0]);
          
          db.close();
        });
      });
    })
    
    .put(function (req, res){
      var project = req.params.project;
      const _id = req.body._id;
      
      try {
        ObjectId(_id)
      } catch(err) {
        return res.json('could not update '+_id);
      }
    
      const body = req.body;
      let updatedEntry = Object.keys(body).reduce(function(obj, k) {
        if (body[k] !== '' && k !== '_id') obj[k] = body[k];
        return obj;
      }, {});
    
      if (body.open === 'false') updatedEntry.open = false;
      
      if (Object.keys(updatedEntry).length > 0) updatedEntry.updated_on = new Date();
    
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection(project).updateOne({_id: ObjectId(_id)}, {$set: updatedEntry}, (err, docs) => {
          if (err) {
            db.close();
            if (Object.keys(updatedEntry).length === 0) return res.json('no updated field sent')
            return res.json('could not update ' + _id);
          }
          
          if (docs.result.n === 0) {
            res.json('could not update ' + _id);
          } else res.json('successfully updated');
          
          db.close();
        });
      });
    })
    
    .delete(function (req, res){
      var project = req.params.project;
      const _id = req.body._id;
    
      try {
        ObjectId(_id)
      } catch(err) {
        return res.json('_id error');
      }
    
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection(project).findOneAndDelete({_id: ObjectId(_id)}, (err, docs) => {
          if (err) {
            db.close();
            return res.json('could not delete ' + _id);
          }
          if (docs.value === null) {
            res.json('_id error');
          } else res.json('deleted ' + _id);
          
          db.close();
        });
      });
    });
    
};
