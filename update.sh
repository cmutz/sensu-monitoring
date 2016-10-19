#!/bin/bash

# on met à jour la liste des paquets du serveur
sudo /usr/bin/apt-get -qq update >& /dev/null || true

# On recherche le nombre de paquets à mettre à jour
NUM_PACKAGES=`sudo /usr/bin/apt-get -q -y --ignore-hold --allow-unauthenticated -s dist-upgrade | /bin/grep ^Inst | /usr/bin/cut -d\  -f2 | /usr/bin/sort |wc -w`
# si la ligne n'est pas trouvée, alors la variable est vide
if [ "$NUM_PACKAGES" -gt 0 ]
then
  # on génère un message d'erreur et un exit code warning (1)
  echo "need update $NUM_PACKAGES package(s) !"
  exit 1
else
  # ici message de succes et exit code à 0
  echo "system up to date ;)"
  exit 0
fi
