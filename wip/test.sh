#!/bin/sh

basedir=`dirname "$0"`
$basedir/data/bin/node --harmony $basedir/data/nsc.js &
$basedir/data/bin/node_appjs --harmony $basedir/data/app.js & wait