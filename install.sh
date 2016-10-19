#!/bin/bash
#########################################
# # Copyright (c) 2016, Clement Mutz <c.mutz@whoople.fr>
# #########################################
# # Created by Clement Mutz
# # Contact at c.mutz@whoople.fr
# #########################################
# Utilisation ./mon_script.sh arg1 arg2 arg3
# arg1 : type de serveur installe : (server ou ipbx)

# changement de repertoire courant !
cd "$(dirname "$0")"

#================== Globals ==================================================
. global.sh

#================== Functions ================================================
[ ! -d $PATH_LIBRARY ] && git clone https://github.com/cmutz/fonction_perso_bash LIBRARY
. $PATH_LIBRARY/functions.sh

#================== Verification =============================================
### you must execute root user
[ `whoami`  != "root" ] && println error "This script need to be launched as root." && exit 1

if test $# -eq 1;then
	println "arguments valides"
else
	println error "\n Usage: ${0} <arg1>"
	println error "\n arg1 type de server installe : (server ou ipbx)"
	exit 1
fi

# On verifie la bonne saisie
if f_checkanswer $1 yes no; then
	println error "\n arg1 attendu : (yes/no)"
	exit 2
fi

#### search package lsb_release ###
if ! type -p lsb_release > /dev/null; then
	echo "Avant toute chose, installez le programme lsb_release (paquet lsb-release sur Debian et CentOS et redhat-lsb sur RedHat)" >&2
	exit 2
fi

### update/upgrade/install for type distribution  ###
f_detectdistro
dist_vendor=$distro
println info "\t$distro"
dist_name=$(lsb_release --short --codename | tr [A-Z] [a-z])
cd "$(dirname "$0")"		# WARNING: current directory has changed!

if [[ $INSTALL_AUTO = no ]]; then
	if  ! f_ask_yn_question "\t*** Vous avez une '$dist_vendor - $dist_name' ***"; then
    	read -r -p " *** Renseigner le nom du syteme (ubuntu,debian,linux_mint) *** " dist_vendor
        read -r -p " *** Renseigner le nom de votre version (quantal,wheezy) *** " dist_name
    fi
fi

### mode non interactif
if [[ $INSTALL_AUTO = yes ]]; then export DEBIAN_FRONTEND=noninteractive; fi

### installation depends ###
# SENSU #
println info "Installation du paquet sensu autossh et de nodejs"
apt-get update -qq
# on ajoute la clef et le dépôt pour sensu
wget -q http://repositories.sensuapp.org/apt/pubkey.gpg -O- | apt-key add -
echo "deb http://repositories.sensuapp.org/apt sensu main" | tee /etc/apt/sources.list.d/sensu.list

# on actualise nos listings et on installe Sensu
apt-get update
apt-get -y install sensu autossh
curl -sL https://deb.nodesource.com/setup_6.x | bash -
apt-get install -y nodejs

cp -r $PATH_CLIENT/* /etc/sensu

# on s'assure que tous les fichiers de conf appartiennent à sensu
chmod +x /etc/sensu/plugins/node_modules/sensu-server-metrics/serverMetrics.js 
chmod +x /etc/sensu/client/plugin/*
chown -R sensu:sensu /etc/sensu

# pour le serveur, on lance au démarrage :
# sensu server, api et uchiwa
update-rc.d sensu-server defaults
update-rc.d sensu-api defaults
update-rc.d uchiwa defaults

# pour les clients, seulement sensu-client
update-rc.d sensu-client defaults

# pour le fun ......
$PATH_BASH $PATH_END_SCRIPT/resume_system.sh






