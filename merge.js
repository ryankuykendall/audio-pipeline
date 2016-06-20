#!/usr/bin/env node

"use strict";

var csv = require('fast-csv');
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');

var cwd = process.cwd();
var executable = process.argv[1];
var responseDirectoryPath = process.argv[2];
var responseDirectoryPathItems = responseDirectoryPath.split('/');
var mergeDirectoryPathItems = responseDirectoryPathItems.slice(0, -1).concat(['merge']);
var mergeDirectoryPath = mergeDirectoryPathItems.join('/');

if (!fs.existsSync(mergeDirectoryPath)) {
  fs.mkdirSync(mergeDirectoryPath);
}

var responses = [];

fs.readdir(responseDirectoryPath, function (err, list) {
  // Return the error if something went wrong
  if (err)
    return action(err);

  // For every file in the list
  list.forEach(function (item) {
    // Full path of that file
    var file = responseDirectoryPath + "/" + item;
    var response = JSON.parse(fs.readFileSync(file));
    responses.push(response);
  })

  responses = responses.sort(function (x, y) {
    return x.start < y.start ? -1 : 1;
  });

  // console.log("Merged responses", JSON.stringify(responses, null, 2));
  var mergeFilename = [mergeDirectoryPath, 'index.json'].join('/');
  fs.writeFileSync(mergeFilename, JSON.stringify(responses, null, 2));
  console.log("Generating JSON", mergeFilename);

  var csvData = responses.map((item, index) => {
    return [item.start, item.end, item.data.text];
  });
  csvData.unshift(['Start time', 'End time', 'Transcription']);
  var csvFilename = [mergeDirectoryPath, 'index.csv'].join('/');

  csv.writeToPath(csvFilename, csvData);
  console.log("Generating CSV", csvFilename);

  console.log("\nNext step: Generate an HTML View\n");
});

// Last thing to do!!! Generate HTML View!!! Celebrate!!!
