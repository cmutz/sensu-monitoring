#!/usr/bin/nodejs

const http = require('http');

// define thresholds
var thresholds = {};
thresholds.loadWarningTime = (process.argv[2]) ? process.argv[2] : 60;
thresholds.loadWarningVal = (process.argv[3]) ? process.argv[3] : 90;
thresholds.loadAlertTime = (process.argv[4]) ? process.argv[4] : 120;
thresholds.loadAlertVal = (process.argv[5]) ? process.argv[5] : 90;
thresholds.memWarningTime = (process.argv[6]) ? process.argv[6] : 60;
thresholds.memWarningVal = (process.argv[7]) ? process.argv[7] : 90;
thresholds.memAltertTime = (process.argv[8]) ? process.argv[8] : 120;
thresholds.memAlertVal = (process.argv[9]) ? process.argv[9] : 90;
thresholds.spaceWarningTime = (process.argv[10]) ? process.argv[10] : 60;
thresholds.spaceWarningVal = (process.argv[11]) ? process.argv[11] : 90;
thresholds.spaceAlertTime = (process.argv[12]) ? process.argv[12] : 120;
thresholds.spaceAlertVal = (process.argv[13]) ? process.argv[13] : 90;
thresholds.ioWarningTime = (process.argv[14]) ? process.argv[14] : 60;
thresholds.ioWarningVal = (process.argv[15]) ? process.argv[15] : 90;
thresholds.ioAlertTime = (process.argv[16]) ? process.argv[16] : 120;
thresholds.ioAlertVal = (process.argv[17]) ? process.argv[17] : 90;

/**
 * check metrics based on specified time range and threshold
 * @param {string} query - influxdb query
 * @param {string} checkType
 * @param {string} level
 * @param {string} threshold
 * @param {string} time
 * @callback
 */
function checkServersMetrics(query, checkType, level, threshold, time, callback) {
    query = encodeURIComponent(query);

    http.get('http://$server_monitoring/query?db=sensu&q=' + query, (res) => {
        res.setEncoding('utf8');
        res.on('data', (data) => {
            data = JSON.parse(data);
            var host;
            var msg = '';
            var exitCode = 0;

            data.results[0].series.forEach((el) => {
                if (el.values[0][1] >= threshold) {
                    if (level === 'alert') exitCode = 2;
                    else exitCode = 1;
                    host = el.tags.host;
                    msg = `${el.tags.host} ${checkType} over ${threshold} for ${time}+ mn`;
                }
            });

            callback({host: host, checkType: checkType, exit: exitCode, msg: msg});
        });

        res.resume();
    }).on('error', (err) => {
        return console.error(err.message);
    });
}
// closure that counts collected results
// and generates final result
var computeResult = (function () {
    var totalResults = 0;
    var results = [];

    return function (result) {
        if (result.exit !== 0) {
            var addResult = true;
            // if it's an alert, remove warning if exist
            if (result.exit === 2) {
                var i = 0;
                results.forEach((el) => {
                    if (el.host === result.host && el.checkType === result.checkType) {
                        results.splice(i);
                    }
                    i++;
                });
            }

            // if it's a warning, make sure there's not already an alert
            if (result.exit === 1) {
                results.forEach((el) => {
                    if (el.host === result.host && el.checkType === result.checkType) {
                        addResult = false;
                    }
                });
            }

            if (addResult) results.push(result);
        }

        if (++totalResults === 8) {
            var msg = '';
            var exitCode = 0;
            results.forEach((el) => {
                if (el.exit > exitCode) {
                    exitCode = el.exit;
                    msg += ' ' + el.msg;
                }
            });

            if (!msg.length) msg = 'Everything is ok';
            console.log(msg);
            process.exit(exitCode);
        }
    };
})();

var queries = {};
queries.loadWarning = 'SELECT MEAN(value) FROM cpu_load WHERE time > now() - ' + thresholds.loadWarningTime + 'm GROUP BY host';
queries.loadAlert = 'SELECT MEAN(value) FROM cpu_load WHERE time > now() - ' + thresholds.loadAlertTime + 'm GROUP BY host';
queries.memWarning = 'SELECT MEAN(value) FROM ram_used WHERE time > now() - ' + thresholds.memWarningTime + 'm GROUP BY host';
queries.memAlert = 'SELECT MEAN(value) FROM ram_used WHERE time > now() - ' + thresholds.memAltertTime + 'm GROUP BY host';
queries.spaceWarning = 'SELECT MEAN(value) FROM fs_usage WHERE time > now() - ' + thresholds.spaceWarningTime + 'm GROUP BY host';
queries.spaceAlert = 'SELECT MEAN(value) FROM fs_usage WHERE time > now() - ' + thresholds.spaceAlertTime + 'm GROUP BY host';
queries.ioWarning = 'SELECT MEAN(value) FROM disk_tIOPS WHERE time > now() - ' + thresholds.ioWarningTime + 'm GROUP BY host';
queries.ioAlert = 'SELECT MEAN(value) FROM disk_tIOPS WHERE time > now() - ' + thresholds.ioAlertTime + 'm GROUP BY host';

for (let prop in queries) {
    var level = (prop.indexOf('Alert') !== -1) ? 'alert' : 'warning';
    var checkType = '';
    if (level === 'alert') checkType = prop.substring(prop.length - 5, 0);
    else checkType = prop.substring(prop.length - 7, 0);

    checkServersMetrics(queries[prop], checkType, level, thresholds[prop + 'Val'], thresholds[prop + 'Time'], computeResult);
}
