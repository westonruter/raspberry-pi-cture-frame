#!/bin/bash
# Install the pi-cture-frame web server and crontab entries

set -e

cd "$(dirname $0)"
app_dir="$(pwd)"

sudo apt-get install -y nginx php5 ttf-mscorefonts-installer unclutter x11-xserver-utils imagemagick

cat nginx.conf | sed "s:{{APP_DIR}}:$app_dir:" | sudo tee /etc/nginx/sites-available/pi-cture-frame > /dev/null
if [ ! -e /etc/nginx/sites-enabled/pi-cture-frame ]; then
	sudo ln -s /etc/nginx/sites-available/pi-cture-frame /etc/nginx/sites-enabled/pi-cture-frame
fi

if ! grep -q pi-cture-frame /etc/hosts; then
	echo '127.0.0.1  pi-cture-frame.local' | sudo tee -a /etc/hosts > /dev/null
fi

mkdir -p "$app_dir/logs"
mkdir -p "$app_dir/www/photo-cache"

cat run-pi-cture-frame.desktop | sed "s:{{APP_DIR}}:$app_dir:" > ~/Desktop/run-pi-cture-frame.desktop

if ! crontab -l | grep -qs 'fetch-pi-cture-frame-photos.php'; then
	echo "Installed crontab"
	(crontab -l 2>/dev/null; echo "") | crontab -
	(crontab -l 2>/dev/null; echo "5 * * * * /usr/bin/php $app_dir/fetch-pi-cture-frame-photos.php") | crontab -
	(crontab -l 2>/dev/null; echo "0 * * * * cd $app_dir && git pull --no-edit --ff-only") | crontab -
fi

sudo service nginx restart
