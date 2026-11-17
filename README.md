# MMM-Packstation

MagicMirror² module showing free DHL Packstation compartments (S/M/L/XL).  
Port of the Home Assistant integration  
[dhl-packstation-availability](https://github.com/TylonHH/dhl-packstation-availability).
Uses the public DHL Postfinder endpoint, no login or API key required.  

## Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/barnosch/MMM-Packstation.git

```

```code
{
	module: "MMM-Packstation",
	position: "top_left",
	config: {
		postalCode: "23611",      // 5-digit postal code of the station
		stationNumber: "202",     // 3-digit Packstation number
		updateInterval: 15 * 60 * 1000,
		showTotal: true,
		showAddress: true,
		showTimestamp: true
	}
}
```

Postal code and station number are the ones shown in theDHL Standortfinder,  
https://www.dhl.de/de/privatkunden/pakete-empfangen/standorte-finden.html




