#!/bin/sh
cat dump_07-09-2022_10_22_05.sql | docker exec -i 59144aebea72 psql -U postgres
