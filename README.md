# erenyamic.github.io
Eren Yamic Portfolio
Prerequisites :
Device version:  4
OS: legacy 32-bit
Reinstall Raspberry Pi OS :
Reboot while holding shift
Correctly set up country and user (name: pi; password: raspberry)
Install Anydesk Raspberry Pi armhf deb version
run anydesk in the terminal will signal an error
run the following can fix the error
search for "anydesk: error while loading stackexchange"

sudo apt install libgles-dev libegl-dev
sudo ln -s /usr/lib/arm-linux-gnueabihf/libGLESv2.so /usr/lib/libbrcmGLESv2.so
sudo ln -s /usr/lib/arm-linux-gnueabihf/libEGL.so /usr/lib/libbrcmEGL.so
Create a connection with the Raspberry Pi
go to Raspberry Pi  Anydesk - settings - security - enable unattended access
set password: "m3aF/4e!1K'^O,

Set the value
// search is /
// change value is s + value then esc
// delete is x 
// quit with saving is :wq
// quit w/o saving is :q!

sudo nano /boot/config.txt

or 
(raspberry pi os bookworm)
sudo nano /boot/firmware/config.txt

disable_overscan=0
hdmi_force_hotplug=1
hdmi_group=2
hdmi_drive=2
config_hdmi_boost=4

The Androvega Apps Download links are below for each OS.
How to install it?
Get AnyDesk id from excel sheet and connect to Customer/Boxing/Kiosk/Kitchen/Map/Pizza Maker/Cashier.
Get url from here for correct OS and paste in url. It will start download automatically.
Change downloaded file as an executable file;
chmode +x filename
To open the app when device starts;

Linux
sudo vi /etc/xdg/lxsession/LXDE-pi/autostart 

/home/pi/Downloads/androvega-pos-setup-0.4.21.AppImage

//sudo nano /etc/xdg/lxsession/LXDE-pi/autostart 
// ctrl + w can quit the application
ctrl+shift+i → to open inspection panel
after running the software, login pwd is 123456
set up server ip as http://192.168.1.190 and socket is ws:// (remove extra s)
setup auto start use
Create a shortcut for the software
preference - main menu editor - new item


Customer
Raspberry pi
https://updates.androvega.ca/customer/linux-arm/androvega-customer-setup-0.2.51.AppImage


Boxing
Raspberry pi
https://updates.androvega.ca/boxing/linux-arm/androvega-boxing-setup-0.4.21.AppImage


Kitchen
Raspberry pi
https://updates.androvega.ca/kitchen/linux-arm/androvega-kitchen-setup-0.2.41.AppImage

Map
Raspberry pi
https://updates.androvega.ca/map/linux-arm/androvega-map-setup-0.2.22.AppImage

Pizza Maker
Raspberry pi
https://updates.androvega.ca/pizzamaker/linux-arm/androvega-pizzamaker-setup-0.2.22.AppImage

Cashier
Raspberry pi
https://updates.androvega.ca/pos/linux-arm/androvega-pos-setup-0.4.22.AppImage

https://appflowy.com/app/9f1c1f31-ac39-40b1-a4f2-0c180752245d/f0a0bd83-d028-4bfd-934f-1c8ded19ae1e
