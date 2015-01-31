#!/bin/bash

# Hide mouse
unclutter

# Disable screensaver
xset s off

# Disable screensaver blanking
xset s noblank

# Disable DPMS (Energy Star) features
xset -dpms

# Preventous this had --kiosk
/usr/bin/chromium-browser --start-fullscreen --start-maximized http://pi-cture-frame.local/
