/* MagicMirror² node_helper for MMM-Packstation */
const NodeHelper = require("node_helper");
const BASE_URL = "https://www.dhl.de/int-postfinder/webservice/rest/v1/locationByPrimaryKeyPF/";

const SIZE_FIELDS = { s: "freeCompartmentsS", m: "freeCompartmentsM", l: "freeCompartmentsL", xl: "freeCompartmentsXl" };

module.exports = NodeHelper.create({

	sockets: {},

	socketNotificationReceived(notification, payload) {
		if (notification !== "PACKSTATION_FETCH") return;
		const key = `${payload.postalCode}_${payload.stationNumber}`;
		if (this.sockets[key]) return; // already polling
		this.sockets[key] = true;
		this.fetchStation(payload.postalCode, payload.stationNumber);
		setInterval(() => this.fetchStation(payload.postalCode, payload.stationNumber), payload.updateInterval || 900000);
	},

	buildStationId(postalCode, stationNumber) {
		// DHL key: leading zeros dropped from postal code only (e.g. 01067 -> 1067)
		return `1-${parseInt(postalCode, 10)}${stationNumber}`;
	},

	async fetchStation(postalCode, stationNumber) {
		const key = this.buildStationId(postalCode, stationNumber);
		try {
			const response = await fetch(BASE_URL + key, { headers: { Accept: "application/json" } });
			if (response.status === 204 || response.status === 404) {
				this.sendResult(postalCode, stationNumber, null, "Packstation nicht gefunden");
				return;
			}
			if (!response.ok) {
				this.sendResult(postalCode, stationNumber, null, `DHL-Fehler: HTTP ${response.status}`);
				return;
			}
			const data = await response.json();
			if (data.primaryKeyPF !== key || data.locationType !== "PACKSTATION") {
				this.sendResult(postalCode, stationNumber, null, "Unerwartete DHL-Antwort");
				return;
			}
			const status = data.liveStatus || {};
			const counts = {};
			for (const [size, field] of Object.entries(SIZE_FIELDS)) {
				const v = status[field];
				counts[size] = (typeof v === "number" && v >= 0) ? v : null;
			}
			if (Object.values(counts).every((v) => v === null)) {
				this.sendResult(postalCode, stationNumber, null, "Keine Live-Fachdaten verfügbar");
				return;
			}
			const address = [`${data.street || ""} ${data.houseNo || ""}`.trim(), `${data.zipCode || ""} ${data.city || ""}`.trim()]
				.filter(Boolean).join(", ");
			this.sendResult(postalCode, stationNumber, {
				name: data.locationName || data.keyWord || key,
				address: address,
				counts: counts,
				updated: status.sourceTimestamp || null
			}, null);
		} catch (error) {
			this.sendResult(postalCode, stationNumber, null, `Abruf fehlgeschlagen: ${error.message}`);
		}
	},

	sendResult(postalCode, stationNumber, station, error) {
		this.sendSocketNotification("PACKSTATION_RESULT", {
			postalCode: postalCode,
			stationNumber: stationNumber,
			station: station,
			error: error
		});
	}
});