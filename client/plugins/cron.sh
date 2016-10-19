#!/bin/bash

# on filtre avec grep à la recherche de la ligne contenant 
# "active (running)"
cron=`service cron status | grep "start/running"`

# si la ligne n'est pas trouvée, alors la variable est vide
if [ -z "$cron" ]
then
  # on génère un message d'erreur et un exit code critial (2)
  echo "Ooops, cron has stopped"
  exit 1
else
  # ici message de succes et exit code à 0
  echo "service cron started"
  exit 0
fi
