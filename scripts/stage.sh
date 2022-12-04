#!/bin/sh
git pull --all
nest run build
pm2 restart all
