# Pi-cture Frame
A picture frame powered by Raspberry Pi

## Hardware

* [Raspberry Pi 7" Touchscreen Display](http://swag.raspberrypi.org/collections/frontpage/products/raspberry-pi-7-inch-touchscreen-display)
* [+5V 2A USB power supply](http://swag.raspberrypi.org/collections/pi-kits/products/raspberry-pi-universal-power-supply)
* Micro USB cable (high-throughput)
* 64GB SD micro card
* [WiFi dongle](http://swag.raspberrypi.org/collections/pi-kits/products/official-raspberry-pi-wifi-dongle)
* 5x7" picture frame
* Misc Erector Set pieces
* Screws for back panel of Pi display

## Tools

* Exacto knife
* Hot glue gun
* Small Phillips head screwdriver
* Erector Set wrenches

## Hardware Installation

1. Connect the Pi to the Pi display (see [The Eagerly Awaited Raspberry Pi Display](https://www.raspberrypi.org/blog/the-eagerly-awaited-raspberry-pi-display/))
2. Remove glass from picture frame and remove the back panel. Both will be discarded.
3. Make cuts to the picture frame to ensure the Pi display fits.
4. Construct brackets from Erector Set pieces to affix the display to the frame and to build a stand for the frame.
5. Glue the brackets to the frame.
6. Connect the Pi display to the frame by screwing to brackets.

## Software Installation

1. Set up the OS on the Pi (e.g. [instructions](https://github.com/westonruter/raspberry-pi-stuff)).
2. Run `sudo raspi-config` and under “Enable Boot to Desktop/Scratch” select “Desktop Login as user pi at the Graphical Desktop” to auto-login to graphical desktop upon boot.
3. Follow instructions at [Running the latest Chromium 45 on Debian Jessie on your Raspberry Pi 2](http://conoroneill.net/running-the-latest-chromium-45-on-debian-jessie-on-your-raspberry-pi-2/)
4. SSH into Pi.
5. Download repo: `git clone --recursive https://github.com/westonruter/pi-cture-frame.git ~/pi-cture-frame`
6. Install app: `bash ~/pi-cture-frame/install.sh`
7. Create a new photo album on Google Photos (or Picasa Web) and add the desired photos to it.
8. Go to [Picasa Web Albums](https://picasaweb.google.com/lh/myphotos), locate the album, and edit the visibility to be “Limited, anyone with the link”.
9. Locate the RSS feed link, copy the URL, and paste it into a new file `.picasaweb-feed-url` in the repo root on the Pi.
10. Manually run the image fetcher for the first time: `php fetch-pi-cture-frame-photos.php`

## Usage

Boot up Pi and click on “Pi-cture Frame” icon on the Desktop. Slideshow will open maximized in Chromium in full-screen mode.

## Credits
By [Weston Ruter](https://weston.ruter.net/). GPL license. Christmas 2015.
