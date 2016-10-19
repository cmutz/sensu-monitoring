#!/bin/bash

# on requête le serveur en localhost en ne demandant que le header
# on filtre la réponse pour ne garder que le ligne avec "HTTP"
web=`curl -s -D - localhost:8069 -o /dev/null | sed -n '/HTTP/p'`

# si la ligne en question contient le code 200, ok
if [[ "$web" == *200* ]]
then
  echo "Server odoo up & port 8069"
  exit 0

# sinon, il y a un problème
else
  echo "Server odoo down !"
  exit 2
fi
