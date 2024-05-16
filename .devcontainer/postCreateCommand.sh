#!/bin/bash

# xdg-open is used to open the browser in the vite start script
# This is not installed by default in the node image
sudo apt-get update 
sudo apt-get install -y xdg-utils

npm install
