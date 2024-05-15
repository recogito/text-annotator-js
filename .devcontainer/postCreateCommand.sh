#!/bin/bash

sudo apt-get update 
sudo apt-get install -y xdg-utils

cd packages/extension-tei
npm install

cd packages/text-annotator
npm install

cd packages/text-annotator-react
npm install
