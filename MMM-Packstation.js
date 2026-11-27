/* MagicMirror² Module: MMM-Packstation
 * Port of https://github.com/TylonHH/dhl-packstation-availability
 * Shows free DHL Packstation compartments by size (S/M/L/XL).
 */
Module.register("MMM-Packstation", {

	defaults: {
		postalCode: "",        // 5-digit postal code, e.g. "23611"
		stationNumber: "",     // 3-digit Packstation number, e.g. "202"
		updateInterval: 15 * 60 * 1000, // 15 minutes
		showTotal: true,
		showAddress: false,
		showTimestamp: true,
		animationSpeed: 1000
	},

	sizes: ["s", "m", "l", "xl"],

	getStyles() {
		return ["MMM-Packstation.css"];
	},

	start() {
		this.station = null;
		this.error = null;
		this.loaded = false;
		if (!/^\d{5}$/.test(this.config.postalCode) || !/^\d{3}$/.test(this.config.stationNumber)) {
			this.error = "Bitte Postleitzahl (5 Ziffern) und Packstation-Nummer (3 Ziffern) in der Konfiguration angeben.";
			return;
		}
		this.scheduleUpdate(500);
	},

	scheduleUpdate(delay) {
		const self = this;
		setTimeout(() => {
			self.sendSocketNotification("PACKSTATION_FETCH", {
				postalCode: self.config.postalCode,
				stationNumber: self.config.stationNumber,
				updateInterval: self.config.updateInterval
			});
			setInterval(() => {
				self.sendSocketNotification("PACKSTATION_FETCH", {
					postalCode: self.config.postalCode,
					stationNumber: self.config.stationNumber,
					updateInterval: self.config.updateInterval
				});
			}, self.config.updateInterval);
		}, delay);
	},

	socketNotificationReceived(notification, payload) {
		if (notification !== "PACKSTATION_RESULT") return;
		if (payload.postalCode !== this.config.postalCode || payload.stationNumber !== this.config.stationNumber) return;
		if (payload.error) {
			this.error = payload.error;
		} else {
			this.error = null;
			this.station = payload.station;
			this.loaded = true;
		}
		this.updateDom(this.config.animationSpeed);
	},

	getDom() {
		const wrapper = document.createElement("div");
		wrapper.className = "packstation";

		if (this.error) {
			const msg = document.createElement("div");
			msg.className = "small dimmed";
			msg.innerHTML = this.error;
			wrapper.appendChild(msg);
			return wrapper;
		}

		if (!this.loaded || !this.station) {
			const msg = document.createElement("div");
			msg.className = "small dimmed";
			msg.innerHTML = "Lade Packstation-Daten …";
			wrapper.appendChild(msg);
			return wrapper;
		}

		if (this.config.showAddress && this.station.address) {
			const address = document.createElement("div");
			address.className = "small dimmed";
			address.innerHTML = this.station.address;
			wrapper.appendChild(address);
		}

		const row = document.createElement("div");
		row.className = "packstation-sizes";

		const counts = this.station.counts;
		const addItem = (label, value, extraClass) => {
			const item = document.createElement("div");
			item.className = "packstation-item" + (extraClass ? " " + extraClass : "");

			// Traffic-light status like the DHL Standortfinder detail view
			let status = "";
			if (value === null) status = "status-none";
			else if (value === 0) status = "status-red";
			else if (value <= 2) status = "status-amber";
			else status = "status-green";
			item.classList.add(status);

			const sizeCell = document.createElement("div");
			sizeCell.className = "packstation-size";
			sizeCell.innerHTML = label;
			item.appendChild(sizeCell);

			const countCell = document.createElement("div");
			countCell.className = "packstation-count" + (value === null ? " none" : "");
			countCell.innerHTML = value !== null ? value : "?";
			item.appendChild(countCell);

			const statusbar = document.createElement("div");
			statusbar.className = "packstation-status";
			const fill = document.createElement("div");
			fill.className = "packstation-status-fill";
			statusbar.appendChild(fill);
			item.appendChild(statusbar);

			row.appendChild(item);
		};

		for (const size of this.sizes) {
			addItem(size.toUpperCase(), counts[size]);
		}

		if (this.config.showTotal) {
			const total = this.sizes.every((s) => counts[s] !== null)
				? this.sizes.reduce((sum, s) => sum + counts[s], 0)
				: null;
			addItem("Σ", total, "total");
		}

		wrapper.appendChild(row);

		if (this.config.showTimestamp && this.station.updated) {
			const updated = document.createElement("div");
			updated.className = "xsmall dimmed";
			const time = new Date(this.station.updated).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
			updated.innerHTML = "Stand: " + time;
			wrapper.appendChild(updated);
		}

		return wrapper;
	}
});
